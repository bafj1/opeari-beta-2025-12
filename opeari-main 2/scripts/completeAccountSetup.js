{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 document.addEventListener('DOMContentLoaded', async () => \{\
  const statusMessage = document.getElementById('statusMessage');\
  const form = document.getElementById('accountForm');\
  const firstNameInput = document.getElementById('firstName');\
  const lastNameInput = document.getElementById('lastName');\
\
  const params = new URLSearchParams(window.location.search);\
  const email = params.get('email');\
  const token = params.get('token');\
\
  if (!email || !token) \{\
    statusMessage.textContent = "Invalid link. Please check your email or request a new invite.";\
    return;\
  \}\
\
  try \{\
    const res = await fetch('/.netlify/functions/verifyAccountToken', \{\
      method: 'POST',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(\{ email, token \})\
    \});\
\
    const result = await res.json();\
\
    if (!result.success) \{\
      statusMessage.textContent = result.message || "This invite link is no longer valid.";\
      return;\
    \}\
\
    // Success: Show form, populate email and first name\
    statusMessage.style.display = 'none';\
    form.style.display = 'block';\
    firstNameInput.value = result.firstName || '';\
    lastNameInput.value = result.lastName || '';\
\
    // Form submit\
    form.addEventListener('submit', async (e) => \{\
      e.preventDefault();\
\
      const pw = document.getElementById('password').value;\
      const confirm = document.getElementById('confirmPassword').value;\
\
      if (pw !== confirm) \{\
        alert("Passwords do not match.");\
        return;\
      \}\
\
      try \{\
        const updateRes = await fetch('/.netlify/functions/completeAccountSetup', \{\
          method: 'POST',\
          headers: \{ 'Content-Type': 'application/json' \},\
          body: JSON.stringify(\{\
            email,\
            token,\
            firstName: firstNameInput.value.trim(),\
            lastName: lastNameInput.value.trim(),\
            password: pw\
          \})\
        \});\
\
        const updateResult = await updateRes.json();\
\
        if (updateResult.success) \{\
          form.innerHTML = `<p style="text-align:center; font-weight:bold;">\uc0\u55356 \u57225  Your account is ready! <br>You can now <a href="/login.html">log in here</a>.</p>`;\
        \} else \{\
          throw new Error(updateResult.message || 'Something went wrong.');\
        \}\
      \} catch (err) \{\
        alert(`Error: $\{err.message\}`);\
      \}\
    \});\
\
  \} catch (error) \{\
    console.error(error);\
    statusMessage.textContent = "Something went wrong. Try again later or request a new invite.";\
  \}\
\});}