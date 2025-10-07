import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { prisma } from "@/lib/prisma" // Declare the prisma variable

export async function POST(request: NextRequest) {
   try {
     const session = await getServerSession(authOptions)

     // Debug logging
     console.log("Session:", JSON.stringify(session, null, 2))
     console.log("Session user:", session?.user)
     console.log("Session user id:", session?.user?.id)

     if (!session || !session.user || !session.user.id) {
       console.log("Session validation failed:", {
         hasSession: !!session,
         hasUser: !!session?.user,
         hasId: !!session?.user?.id
       })

       // Try to get user ID from email as fallback
       if (session?.user?.email) {
         console.log("Attempting fallback user lookup by email:", session.user.email)
         try {
           const user = await prisma.user.findUnique({
             where: { email: session.user.email }
           })
           if (user) {
             console.log("Found user by email, using ID:", user.id)
             session.user.id = user.id.toString()
           }
         } catch (error) {
           console.error("Fallback user lookup failed:", error)
         }
       }

       if (!session?.user?.id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
       }
     }

     console.log("=== PARSING FORM DATA ===")
     const formData = await request.formData()
     console.log("FormData parsed successfully")

     const file = formData.get("file") as File
     const type = formData.get("type") as string // 'appraisal' or 'achievement'
     const entityId = formData.get("entityId") as string

     console.log("Parsed values:", { file: !!file, type: type, entityId: entityId })

     if (!file) {
       console.log("No file provided")
       return NextResponse.json({ error: "No file provided" }, { status: 400 })
     }

     if (!type) {
       console.log("No type provided, type value:", type)
       return NextResponse.json({ error: "No type provided. Expected 'appraisal' or 'achievement'" }, { status: 400 })
     }

     if (!entityId) {
       console.log("No entityId provided, entityId value:", entityId)
       return NextResponse.json({ error: "No entityId provided" }, { status: 400 })
     }

     // Validate file type
     const allowedTypes = [
       "application/pdf",
       "image/jpeg",
       "image/png",
       "image/gif",
       "application/msword",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
     ]

     if (!allowedTypes.includes(file.type)) {
       return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
     }

     // Validate file size (10MB max)
     const maxSize = 10 * 1024 * 1024 // 10MB
     if (file.size > maxSize) {
       return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
     }

     // Create upload directory
     console.log("=== STARTING UPLOAD DEBUG ===")
     console.log("Session user id:", session.user.id, "type:", typeof session.user.id)
     console.log("Session user:", session.user)
     console.log("Process cwd:", process.cwd(), "type:", typeof process.cwd())
     console.log("Type:", type, "type of:", typeof type)

     const userId = session.user.id || (session as any).userId
     console.log("Extracted userId:", userId, "type:", typeof userId)

     if (!userId || typeof userId !== 'string') {
       console.error("VALIDATION FAILED - No valid user ID:", {
         userId: userId,
         userIdType: typeof userId,
         sessionUserId: session.user.id,
         sessionUserIdType: typeof session.user.id
       })
       return NextResponse.json({ error: "User ID not available" }, { status: 400 })
     }

     console.log("VALIDATION PASSED - About to call join()")
     console.log("Parameters:", { cwd: process.cwd(), uploads: "uploads", type: type, userId: userId })

     const uploadDir = join(process.cwd(), "uploads", type, userId)
     console.log("JOIN RESULT:", uploadDir, "type:", typeof uploadDir)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${entityId}-${timestamp}.${extension}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save file record to database
    const relativePath = join("uploads", type, userId, filename)

    if (type === "appraisal") {
       await prisma.evidence.create({
         data: {
           appraisalId: parseInt(entityId),
           title: file.name,
           description: "Uploaded evidence file",
           url: relativePath,
           fileKey: filename,
           points: 0,
         },
       })
     } else if (type === "achievement") {
       // For achievements, we'll use the Evidence model as well
       // The specific achievement type should be handled by the calling component
       await prisma.evidence.create({
         data: {
           appraisalId: parseInt(entityId),
           title: file.name,
           description: "Uploaded achievement file",
           url: relativePath,
           fileKey: filename,
           points: 0,
         },
       })
     }

    return NextResponse.json({
      message: "File uploaded successfully",
      filename,
      path: relativePath,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
