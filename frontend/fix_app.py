import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"import WithdrawalsPage from '\./pages/WithdrawalsPage';\n?", "", content)
content = re.sub(r"\s*<Route path=\"withdrawals\" element={<WithdrawalsPage />} />\n?", "", content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
