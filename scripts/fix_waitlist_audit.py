
import os
import re

file_path = 'src/pages/Waitlist.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
insert_block = False

for line in lines:
    
    # 1. Hide Hero Image when success is true
    # Look for the hero image in the main column (not the one I added in success)
    # It has 'src={heroImg}' and 'className="w-[180px]...'
    if 'src={heroImg}' in line and 'className="w-[180px]' in line:
        new_lines.append(f'          {{!success && {line.strip()}}}\n')
        continue

    # 2. Simplify Insert Payload
    # Identifiers for lines to comment out inside the insert block
    # We want to keep first_name, last_name, email, zip_code
    # We suspect user_type (role?), urgency, referral_*, why_join might be missing
    
    if '.insert({' in line:
        insert_block = True
        new_lines.append(line)
        continue
    
    if insert_block and '})' in line:
        insert_block = False
        new_lines.append(line)
        continue

    if insert_block:
        # Check for risky fields
        # Keep: first_name, last_name, email, zip_code
        if any(x in line for x in ['first_name:', 'last_name:', 'email:', 'zip_code:']):
            new_lines.append(line)
        else:
            # Comment out everything else
            # But avoid double commenting
            if not line.strip().startswith('//'):
                # Preserve indentation
                prefix = line[:line.find(line.strip())]
                new_lines.append(f'{prefix}// {line.strip()}\n')
            else:
                new_lines.append(line)
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Successfully patched Waitlist.tsx")
