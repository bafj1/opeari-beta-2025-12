# Settings V1.2 Verification Checklist

## 1. Interaction Model (Save Behavior)

- [ ] **Tab Switching**: Navigate between all tabs (Profile, Experience/Needs, Schedule, Village, Account).
- [ ] **Save Button State**:
  - [ ] Button starts disabled.
  - [ ] Button enables when a change is made ("dirty" state).
  - [ ] Click Save -> shows "Saving..." text.
  - [ ] After save, button disables again / shows "Saved!".
  - [ ] Toast notification appears on success.

## 2. Profile Tab

- [ ] **Avatar Upload**:
  - [ ] Upload a photo.
  - [ ] Verify preview updates immediately.
  - [ ] Save and reload page -> Photo persists.
  - [ ] Remove photo -> Save and reload -> Photo is gone.
- [ ] **Input Fields**:
  - [ ] Edit Name, Phone, Zip, Bio.
  - [ ] Edit Social Handles (Instagram, LinkedIn, Facebook).
  - [ ] Save and refresh -> All values persist.
- [ ] **Kids Section**:
  - [ ] Add a new child (Name: "Test Kid", Year: "2020").
  - [ ] Save.
  - [ ] Refresh page -> Child appears in list.
  - [ ] Delete child.
  - [ ] Refresh page -> Child is gone.

## 3. Family Needs (or Caregiver Experience)

- [ ] **Days Available**:
  - [ ] Toggle Monday, Wednesday.
  - [ ] Checkbox/Pill visual state updates correctly.
  - [ ] Save and refresh -> Selection persists.
- [ ] **Time Blocks**:
  - [ ] Toggle Morning, Evening.
  - [ ] Save and refresh -> Persists.
- [ ] **Budget / Hourly Rate**:
  - [ ] Select a budget tier (Family) or enter Rate (Caregiver).
  - [ ] Save and refresh -> Persists.
- [ ] **Multi-selects**:
  - [ ] Select Care Types, Age Groups, Special Requirements.
  - [ ] Save and refresh -> Persists.

## 4. Village Intent

- [ ] **Support Offered**: Select items -> Save -> Persist.
- [ ] **Support Needed**: Select items -> Save -> Persist.
- [ ] **Visuals**: Verify "NoteBanner" (Peach/Mint) is displayed.

## 5. Schedule Tab

- [ ] **Summary View**: Shows the days/times selected in the Care/Needs tab.
- [ ] **Schedule Notes**: Edit text -> Save -> Refresh -> Persists.

## 6. Mobile Responsiveness

- [ ] **Horizontal Scrolls**: Check Days/Time toggles on mobile view.
- [ ] **Sticky Footer**: (If implemented) or accessible Save button at bottom.
