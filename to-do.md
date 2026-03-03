# Qualification Settings (Editable)

- Admin must be able to change the qualifying percentage at any time.
- Example:
  - 35% this year → 40% next year
- The system should automatically mark students as:
  - **Qualified for Level-2**
  - **Not Qualified**

---

# Automatic Ranking & Tie-Breaking

The system must automatically generate ranks for both **Level-1** and **Level-2** based on:

1. Total Marks  
2. Achievers Section  
3. Higher Difficulty / Application Questions  
4. Level-1 Marks (for Level-2 ranking)  
5. Age (Younger Preferred)

- Tie-break order must be editable from the Admin Panel.

---

# Admin Override (Very Important)

Admin must be able to:

- Edit marks  
- Change rank manually  
- Assign joint rank  
- Recalculate results  
- Approve final ranking  

---

# Dynamic Subject Management (Very Important)

The system must allow Admin to create, edit, or remove subjects from the Admin Panel.

Admin should be able to:

- Add new subjects (e.g., Computer, AI, Coding, Reasoning, etc.)
- Set exam level (Level-1 / Level-2)
- Assign paper structure
- Configure qualification rules
- Configure prizes subject-wise
- Generate separate result & rank list per subject

---

# Prize Auto Generation with Manual Override

- The system should automatically assign prizes based on predefined rank configuration.

However, Admin must be able to:

- Edit prize allocation  
- Change prize winner  
- Add or remove prizes manually  
- Assign special awards independently of rank  

- Final prize allocation must remain editable from the Admin Panel.

---

# Result Management Features

- Result flow:  
  **Draft → Review → Approve → Lock & Publish**
- Results should be visible only after Super Admin approval.
- Super Admin must be able to:
  - Unlock → Edit → Re-lock → Republish (even after declaration)
- Normal Admins should not be allowed to edit locked results.