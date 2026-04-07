import re

with open('src/layouts/MainLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Withdrawals link
content = re.sub(r"\s*\{\s*icon:\s*CreditCard,\s*label:\s*'السحوبات',\s*to:\s*'/withdrawals'\s*\},", "", content)

# Rename Debts link
content = content.replace("'الديون والسلف'", "'الديون، السلف والسحوبات'")

# Remove CreditCard import if it exists and isn't needed anywhere else
content = content.replace("CreditCard,", "")

with open('src/layouts/MainLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
