/**
 * User rows come from legacy copy (`pnpm users:migrate-legacy` / full migrate).
 * Do not create draft `staff` / `admin123` accounts.
 */
async function main() {
  console.log(
    'Không seed user nháp. Tài khoản CRM lấy từ copy DB cũ (kha, buinam, admin).',
  );
}

void main();
