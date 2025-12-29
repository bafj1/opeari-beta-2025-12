# Supabase Email Setup Guide

This guide explains how to customize the Supabase "Magic Link" email template to match Opeari's branding.

## 1. Access Email Settings

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (`opeari-beta`).
3. In the left sidebar, go to **Authentication** -> **Email Templates**.

## 2. Customize "Magic Link" Template

1. Find the **Magic Link** section (it might be the default tab).
2. Ensure "Subject" is set to: `Your Opeari Login Link` (or similar).
3. In the **Body** field, replace the existing content with the following HTML:

```html
<div style="font-family: 'Comfortaa', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <!-- Replace with your actual logo URL if different -->
    <img src="https://opeari.com/opeari-logo.png" alt="Opeari" style="height: 40px;" />
  </div>
  
  <h1 style="color: #1e6b4e; font-size: 24px; text-align: center; margin-bottom: 20px;">
    Welcome to Opeari
  </h1>
  
  <p style="color: #4a6163; font-size: 16px; text-align: center; margin-bottom: 30px;">
    Click the button below to sign in to your account.
  </p>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <a href="{{ .ConfirmationURL }}" 
       style="background-color: #1e6b4e; color: white; padding: 16px 32px; 
              text-decoration: none; border-radius: 12px; font-weight: bold;
              display: inline-block;">
      Sign In to Opeari
    </a>
  </div>
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    This link expires in 24 hours. If you didn't request this, you can ignore this email.
  </p>
  
  <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
    <p style="color: #999; font-size: 12px;">
      Opeari — It takes a village. Let's build yours.
    </p>
  </div>
</div>
```

## 3. Save Changes

1. Click the **Save** button in the top right or bottom of the section.

## 4. Test

1. Go to your app's login page.
2. Enter your email and request a magic link.
3. Check your email to verify the new design.
