# tell-design-data

If your IDE shows the workspace as `/volumes/developer/workspace`, open:

**`/volumes/developer/workspace/tell-design-data`**

Same files also at:
- `developer-drop/tell-design-data/`
- `developer-drop/tell-design-data.tar.gz`

Pull latest branch if the folder looks empty:

```bash
git fetch origin cursor/design-training-data-plan-3774
git checkout cursor/design-training-data-plan-3774
ls tell-design-data/src
```

Push to your private repo:

```bash
cd /volumes/developer/workspace/tell-design-data
git init -b main
git remote add origin https://github.com/ashishpatill/tell-design-data.git
git add -A
git commit -m "feat: local Tell design training-data harness"
git push -u origin main
```
