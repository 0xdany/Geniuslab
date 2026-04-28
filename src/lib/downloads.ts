import { slugify } from "@/lib/ids";

export function videoDownloadName(candidateName: string, assessmentTitle: string, questionNumber: number, ext: string) {
  return `${slugify(candidateName)}_${slugify(assessmentTitle)}_Q${questionNumber}.${ext}`;
}

export function videoZipFolder(candidateName: string, assessmentTitle: string) {
  return `${slugify(candidateName)}_${slugify(assessmentTitle)}`;
}
