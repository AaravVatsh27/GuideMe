import { auth } from "@/Backend/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

function createAvatarUploader() {
  return f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        userId: metadata.userId,
        ufsUrl: file.ufsUrl,
      };
    });
}

export const uploadRouter = {
  mentorAvatar: createAvatarUploader(),
  studentAvatar: createAvatarUploader(),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
