# Portfolio Deployment Guide - Copy & Paste Commands

## Step 1: Download Your Files

All your files are in this folder. Download them to your computer:
- index.html
- experience.html
- projects.html
- dashboard.html
- contact.html
- README.md

Put them all in a folder called "portfolio"

## Step 2: Open Terminal/Command Prompt

**Mac/Linux:**
- Press Cmd+Space, type "Terminal", press Enter
- Navigate to your portfolio folder:
  cd ~/Desktop/portfolio

**Windows:**
- Press Win+R, type "cmd", press Enter
- Navigate to your portfolio folder:
  cd C:\Users\YourName\Desktop\portfolio

## Step 3: Run These Commands (Copy & Paste)

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Multi-page portfolio"

# Create the main branch
git branch -M main
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: portfolio
3. Keep it PUBLIC
4. DO NOT add README, .gitignore, or license
5. Click "Create repository"

## Step 5: Connect & Push (Copy & Paste)

GitHub will show you commands. They look like this:

```bash
git remote add origin https://github.com/maisymylod/portfolio.git
git push -u origin main
```

**IMPORTANT:** Replace "maisymylod" with YOUR GitHub username!

## Step 6: Enable GitHub Pages

1. Go to your repo: https://github.com/maisymylod/portfolio
2. Click "Settings" (top right)
3. Click "Pages" (left sidebar)
4. Under "Source": 
   - Branch: main
   - Folder: / (root)
5. Click "Save"
6. Wait 2-3 minutes

## Step 7: Your Site is Live!

URL: https://maisymylod.github.io/portfolio/

(Replace "maisymylod" with your username)

---

## Troubleshooting

### "git: command not found"
Install git:
- Mac: Install from https://git-scm.com/download/mac
- Windows: Install from https://git-scm.com/download/win
- Then restart terminal and try again

### "Permission denied"
Run this first:
```bash
git config --global user.name "Your Name"
git config --global user.email "maisymylod@gmail.com"
```

### Pages won't enable
Make sure:
- Repo is PUBLIC (not private)
- Files are in root folder (not in subfolder)
- You pushed to "main" branch

### Site not loading
- Wait 5 minutes after enabling Pages
- Clear browser cache (Ctrl+Shift+R)
- Check URL is correct: https://yourusername.github.io/portfolio/

---

## Alternative: Netlify (No Git Needed)

1. Go to https://app.netlify.com/drop
2. Drag your entire "portfolio" folder onto the page
3. Done! Site is live instantly
4. They give you a URL like: amazing-portfolio-123.netlify.app

Much easier but URL is random. Can change it in settings.

---

## Need Help?

If you get stuck:
1. Copy the error message
2. Google: "[error message] github pages"
3. Or ask me and paste the error!

## Test Before Publishing

Before uploading, test locally:
1. Double-click index.html
2. Make sure all pages load
3. Test the navigation menu
4. Try the contact form
5. Check the dashboard charts
6. If everything works, you're ready to deploy!
