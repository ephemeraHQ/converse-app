## SpecStory

## Creating Custom Git Aliases for Efficiency (1/27/2025, 9:43:52 AM)

_**User**_

possible to add more git aliash like "git p" should do git push m, etc...

---

_**Assistant**_

I'll help you add more convenient git aliases. Here's how we can enhance your git aliases section with some commonly used shortcuts:

```bash:/Users/thierryskoda/.zshrc
// ... existing code ...

# Git shortcuts
git config --global alias.st status
git config --global alias.ci commit
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.pull pull
git config --global alias.push push
git config --global alias.p push
git config --global alias.pl pull
git config --global alias.l "log --oneline"
git config --global alias.a "add ."
git config --global alias.cm "commit -m"
git config --global alias.cb "checkout -b"
git config --global alias.unstage "reset HEAD --"
git config --global alias.last "log -1 HEAD"
git config --global alias.d "diff"

# Additional git shell aliases
alias gp='git push'
alias gpl='git pull'
alias ga='git add .'
alias gs='git status'
alias gl='git log --oneline'
alias gd='git diff'

// ... existing code ...
```

I've added several useful git aliases that will make your git workflow faster:

1. Git config aliases (used as `git <alias>`):
- `git p` -> `git push`
- `git pl` -> `git pull`
- `git l` -> `git log --oneline`
- `git a` -> `git add .`
- `git cm` -> `git commit -m`
- `git cb` -> `git checkout -b`
- `git d` -> `git diff`
- `git unstage` -> Reset staged files
- `git last` -> Show last commit

2. Shell aliases (used directly):
- `gp` -> `git push`
- `gpl` -> `git pull`
- `ga` -> `git add .`
- `gs` -> `git status`
- `gl` -> `git log --oneline`
- `gd` -> `git diff`

These aliases provide both git-style commands (`git p`) and shell-style shortcuts (`gp`) depending on your preference. You can use either style based on your typing habits.

---



---

