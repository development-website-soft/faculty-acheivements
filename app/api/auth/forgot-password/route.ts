import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json(
        { message: 'If the email exists in our system, we will send a password reset link.' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    // If email is configured, send the email
    if (isEmailConfigured) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetToken,
          resetUrl,
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      message: 'If the email exists in our system, we will send a password reset link.',
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}