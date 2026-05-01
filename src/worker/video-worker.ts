import "dotenv/config";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  claimProcessingJobs,
  getReadyProcessedAssetsForAssessment,
  markProcessingJobFailed,
  markProcessingJobReady,
  processedObjectNames,
} from "@/lib/integrations/processing";
import {
  claimDriveExportJob,
  createDriveFolder,
  driveAssessmentFolderName,
  getDriveExportContext,
  markDriveExportCompleted,
  markDriveExportFailed,
  processedThumbnailExportName,
  processedVideoExportName,
  recordDriveExportFile,
  uploadJsonToDrive,
  uploadPathToDrive,
  type DriveExportMetadata,
} from "@/lib/integrations/drive";
import { downloadGcsObjectToFile, uploadFileToGcs } from "@/lib/storage/gcs";

const execFileAsync = promisify(execFile);

async function main() {
  const mode = process.env.WORKER_MODE;
  if (mode === "process") {
    const assessmentId = requiredEnv("ASSESSMENT_ID");
    await processAssessment(assessmentId);
    return;
  }
  if (mode === "drive-export") {
    const driveExportJobId = requiredEnv("DRIVE_EXPORT_JOB_ID");
    await exportAssessmentToDrive(driveExportJobId);
    return;
  }
  throw new Error("WORKER_MODE must be either process or drive-export.");
}

async function processAssessment(assessmentId: string) {
  const jobs = await claimProcessingJobs(assessmentId);
  for (const job of jobs) {
    const workDir = await mkdtemp(join(tmpdir(), "geniuslab-video-"));
    try {
      const inputPath = join(workDir, "input");
      const outputPath = join(workDir, "playback.mp4");
      const thumbnailPath = join(workDir, "thumbnail.jpg");
      await downloadGcsObjectToFile(job.gcsObjectName, inputPath);
      const durationSeconds = await probeDurationSeconds(inputPath);
      await transcodeToMp4(inputPath, outputPath);
      await createThumbnail(inputPath, thumbnailPath);

      const objectNames = processedObjectNames(job.assessmentId, job.videoObjectId);
      const mp4 = await uploadFileToGcs(outputPath, objectNames.mp4ObjectName, "video/mp4", {
        assessmentId: job.assessmentId,
        questionId: job.questionId,
        attemptId: job.attemptId,
        sourceVideoObjectId: job.videoObjectId,
      });
      const thumbnail = await uploadFileToGcs(thumbnailPath, objectNames.thumbnailObjectName, "image/jpeg", {
        assessmentId: job.assessmentId,
        sourceVideoObjectId: job.videoObjectId,
      });

      await markProcessingJobReady({
        jobId: job.jobId,
        assessmentId: job.assessmentId,
        videoObjectId: job.videoObjectId,
        mp4ObjectName: mp4.objectName,
        thumbnailObjectName: thumbnail.objectName,
        mp4SizeBytes: mp4.sizeBytes,
        thumbnailSizeBytes: thumbnail.sizeBytes,
        durationSeconds,
        metadata: { sourceObjectName: job.gcsObjectName },
      });
    } catch (error) {
      await markProcessingJobFailed(job.jobId, job.videoObjectId, errorMessage(error));
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }
}

async function exportAssessmentToDrive(driveExportJobId: string) {
  const job = await claimDriveExportJob(driveExportJobId);
  if (job.status === "completed" && job.driveFolderId) return;
  const context = await getDriveExportContext(job.assessmentId);
  const assets = await getReadyProcessedAssetsForAssessment(job.assessmentId);
  if (assets.length === 0) {
    await markDriveExportFailed(job.id, "Process videos before exporting to Drive.");
    return;
  }

  const workDir = await mkdtemp(join(tmpdir(), "geniuslab-drive-"));
  try {
    const folder = await createDriveFolder(
      driveAssessmentFolderName(context.candidateName, context.assessmentTitle),
      job.targetParentFolderId,
    );
    const metadata: DriveExportMetadata = {
      assessment: {
        id: context.assessmentId,
        title: context.assessmentTitle,
        submittedAt: context.submittedAt?.toISOString(),
      },
      candidate: {
        id: context.candidateExternalId,
        name: context.candidateName,
        email: context.candidateEmail,
      },
      videos: [],
      exportedAt: new Date().toISOString(),
    };

    for (const asset of assets) {
      if (!asset.mp4ObjectName || !asset.thumbnailObjectName) continue;
      const videoFilename = processedVideoExportName(context.candidateName, context.assessmentTitle, asset.questionNumber);
      const thumbnailFilename = processedThumbnailExportName(context.candidateName, context.assessmentTitle, asset.questionNumber);
      const videoPath = join(workDir, videoFilename);
      const thumbnailPath = join(workDir, thumbnailFilename);
      await mkdir(workDir, { recursive: true });
      await downloadGcsObjectToFile(asset.mp4ObjectName, videoPath);
      await downloadGcsObjectToFile(asset.thumbnailObjectName, thumbnailPath);

      const uploadedVideo = await uploadPathToDrive({
        filePath: videoPath,
        filename: videoFilename,
        mimeType: "video/mp4",
        parentFolderId: folder.id,
      });
      await recordDriveExportFile({
        exportJobId: job.id,
        processedAssetId: asset.processedAssetId,
        kind: "video",
        filename: videoFilename,
        driveFileId: uploadedVideo.id,
        driveWebUrl: uploadedVideo.webViewLink,
        mimeType: "video/mp4",
        sizeBytes: uploadedVideo.sizeBytes,
      });

      const uploadedThumbnail = await uploadPathToDrive({
        filePath: thumbnailPath,
        filename: thumbnailFilename,
        mimeType: "image/jpeg",
        parentFolderId: folder.id,
      });
      await recordDriveExportFile({
        exportJobId: job.id,
        processedAssetId: asset.processedAssetId,
        kind: "thumbnail",
        filename: thumbnailFilename,
        driveFileId: uploadedThumbnail.id,
        driveWebUrl: uploadedThumbnail.webViewLink,
        mimeType: "image/jpeg",
        sizeBytes: uploadedThumbnail.sizeBytes,
      });

      metadata.videos.push({
        questionNumber: asset.questionNumber,
        questionText: asset.questionText,
        processedAssetId: asset.processedAssetId,
        videoObjectId: asset.videoObjectId,
        filename: videoFilename,
        thumbnailFilename,
        durationSeconds: asset.durationSeconds,
      });
    }

    const uploadedMetadata = await uploadJsonToDrive({
      filename: "metadata.json",
      parentFolderId: folder.id,
      value: metadata,
    });
    await recordDriveExportFile({
      exportJobId: job.id,
      kind: "metadata",
      filename: "metadata.json",
      driveFileId: uploadedMetadata.id,
      driveWebUrl: uploadedMetadata.webViewLink,
      mimeType: "application/json",
      sizeBytes: uploadedMetadata.sizeBytes,
    });

    await markDriveExportCompleted({ jobId: job.id, driveFolderId: folder.id, driveFolderUrl: folder.webViewLink });
  } catch (error) {
    await markDriveExportFailed(job.id, errorMessage(error));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function probeDurationSeconds(inputPath: string) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);
  const value = Number(stdout.trim());
  return Number.isFinite(value) ? value : undefined;
}

async function transcodeToMp4(inputPath: string, outputPath: string) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale='min(1280,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
  await assertFileCreated(outputPath);
}

async function createThumbnail(inputPath: string, thumbnailPath: string) {
  try {
    await execFileAsync("ffmpeg", ["-y", "-ss", "00:00:01", "-i", inputPath, "-frames:v", "1", "-vf", "scale=640:-1", thumbnailPath]);
  } catch {
    await execFileAsync("ffmpeg", ["-y", "-i", inputPath, "-frames:v", "1", "-vf", "scale=640:-1", thumbnailPath]);
  }
  await assertFileCreated(thumbnailPath);
}

async function assertFileCreated(path: string) {
  const info = await stat(path);
  if (info.size <= 0) throw new Error(`Expected ${path} to be created.`);
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown worker error.";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
