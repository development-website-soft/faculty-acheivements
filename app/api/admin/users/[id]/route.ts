import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== UserRole.ADMIN) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const id = Number(params.id)
    const body = await request.json()
    const {
      email,
      name,
      role,
      status,
      password,
      currentPassword,
      collegeId,
      departmentId,
      idNumber,
      dateOfBirth,
      academicRank,
      nationality,
      generalSpecialization,
      specificSpecialization,
      dateOfEmployment,
      image,
    } = body

    // Handle different update scenarios
    const isEmailUpdate = email !== undefined
    const isPasswordUpdate = password !== undefined || currentPassword !== undefined
    const isFullUpdate = name !== undefined || role !== undefined || status !== undefined

    // Validate based on what's being updated
    if (isFullUpdate && (!name || !role)) {
      return NextResponse.json({ error: "Name and role are required for full updates" }, { status: 400 })
    }

    if (isEmailUpdate && !email) {
      return NextResponse.json({ error: "Email is required for email updates" }, { status: 400 })
    }

    if (email && !email.endsWith("@uob.edu")) {
      return NextResponse.json({ error: "Email must end with @uob.edu" }, { status: 400 })
    }

    // Handle password updates with current password verification
    let passwordHash: string | undefined
    if (password) {
      // For password updates, verify current password
      if (currentPassword) {
        const currentUser = await prisma.user.findUnique({
          where: { id },
          select: { passwordHash: true }
        })
        
        if (!currentUser?.passwordHash) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash)
        if (!isCurrentPasswordValid) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
        }
      }
      
      passwordHash = await bcrypt.hash(password, 12)
    }

    // Build update data object with only provided fields
    const updateData: any = {}
    
    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status
    if (passwordHash !== undefined) updateData.passwordHash = passwordHash
    if (collegeId !== undefined) updateData.collegeId = collegeId ? Number(collegeId) : null
    if (departmentId !== undefined) updateData.departmentId = departmentId ? Number(departmentId) : null
    if (idNumber !== undefined) updateData.idNumber = idNumber
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (academicRank !== undefined) updateData.academicRank = academicRank
    if (nationality !== undefined) updateData.nationality = nationality
    if (generalSpecialization !== undefined) updateData.generalSpecialization = generalSpecialization
    if (specificSpecialization !== undefined) updateData.specificSpecialization = specificSpecialization
    if (dateOfEmployment !== undefined) updateData.dateOfEmployment = dateOfEmployment ? new Date(dateOfEmployment) : null
    if (image !== undefined) updateData.image = image

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department: { include: { college: true } },
        college: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = Number(id)

    // First, delete all related appraisals to avoid foreign key constraint
    await prisma.appraisal.deleteMany({
      where: { facultyId: userId }
    })

    // Then delete the user
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
