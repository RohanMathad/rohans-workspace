async page => {
  await page.waitForSelector('main', { timeout: 10000 });
  const bodyText = await page.locator('main').innerText();
  console.log('Overview contains KPI cards:', bodyText.includes('Total Income') && bodyText.includes('Total Expense'));
  console.log('Overview contains dynamic deltas:', bodyText.includes('% vs last month'));
  console.log('Overview contains Where Money Went:', bodyText.includes('Where Money Went'));

  // 2. Basket Page Check & Settlement
  await page.getByRole('navigation', { name: 'Finance navigation' }).getByRole('button', { name: 'Basket' }).click();
  await page.waitForTimeout(500);
  const boughtBtns = page.getByRole('button', { name: 'Bought' });
  const boughtCount = await boughtBtns.count();
  console.log('Basket planned items count:', boughtCount);

  if (boughtCount > 0) {
    // Settle the first item
    await boughtBtns.first().click();
    await page.waitForTimeout(400);
    const settleModalVisible = await page.getByText('Move "Sugar 2kg" to Expense Ledger').isVisible();
    console.log('Settle modal visible:', settleModalVisible);

    await page.getByRole('button', { name: 'Add to Finance Budget' }).click();
    await page.waitForTimeout(500);
    const boughtCountAfter = await page.getByRole('button', { name: 'Bought' }).count();
    console.log('Basket planned items count after settlement:', boughtCountAfter);
  }

  // 3. Activity Page Check
  await page.getByRole('navigation', { name: 'Finance navigation' }).getByRole('button', { name: 'Activity' }).click();
  await page.waitForTimeout(500);
  const activityText = await page.locator('main').innerText();
  console.log('Activity ledger has transactions:', activityText.includes('Today') || activityText.includes('Yesterday'));
  console.log('Activity ledger has settled Sugar 2kg:', activityText.includes('Sugar 2kg'));

  // 4. Categories Page Check
  await page.getByRole('navigation', { name: 'Finance navigation' }).getByRole('button', { name: 'Categories' }).click();
  await page.waitForTimeout(500);
  const categoriesText = await page.locator('main').innerText();
  console.log('Categories page loaded:', categoriesText.includes('Category Manager'));
}
