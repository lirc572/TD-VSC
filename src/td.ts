import os from 'os';
import path from 'path';
import * as vscode from 'vscode';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

const declFrequencySelector = 'select[name=declFrequency]';
const backButtonSelector = 'table > tbody > tr > td > input[type=button][value=Back]';

export async function declare(username: string, password: string, tmpAm?: string, tmpPm?: string): Promise<string | Error | undefined> {
  let browser, page;
  const saveDir = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : os.homedir();
  try {
    browser = await puppeteer.launch({ headless: true });
    console.log('Running task...');

    tmpAm = tmpAm || getTemperature();
    tmpPm = tmpPm || getTemperature();

    page = await browser.newPage();
    await page.goto('https://myaces.nus.edu.sg/htd');

    // login
    await page.type('#userNameInput', username);
    await page.type('#passwordInput', password);
    // await page.$eval('#passwordInput', el => el.type = 'text');
    // await page.screenshot({path: 'loginDetails.png'});
    await delay(1000);
    await page.click('#submitButton');

    // fill info
    try {
      await page.waitForSelector(declFrequencySelector, {
        timeout: 5000,
      });
    } catch (err) {
      await page.screenshot({ path: path.join(saveDir, 'td-ss.png') });
      // eslint-disable-next-line no-throw-literal
      throw 'Invalid Credentials';
    }
    await page.select(declFrequencySelector, 'A'); // select AM ('P' => 'PM", 'A' => 'AM')
    await page.click('table > tbody > tr > td > input[type=radio][name=symptomsFlag][value=N]'); // have Covid symptoms?
    await page.click('table > tbody > tr > td > input[type=radio][name=familySymptomsFlag][value=N]'); // family members have Covid symptoms?
    page.type('#temperature', tmpAm); // temperature reading

    // submit
    await delay(1000);
    await page.click('table > tbody > tr > td > input[type=button][name=Save]');
    await page.waitForSelector(backButtonSelector);
    console.log(`AM done! ✨`);

    if (new Date().getHours() > 11) {
      // go back
      await page.click(backButtonSelector);

      // fill info
      await page.waitForSelector(declFrequencySelector);
      await page.select(declFrequencySelector, 'P'); // select AM ('P' => 'PM", 'A' => 'AM')
      await page.click('table > tbody > tr > td > input[type=radio][name=symptomsFlag][value=N]'); // have Covid symptoms?
      await page.click('table > tbody > tr > td > input[type=radio][name=familySymptomsFlag][value=N]'); // family members have Covid symptoms?
      page.type('#temperature', tmpPm); // temperature reading

      // submit
      await delay(1000);
      await page.click('table > tbody > tr > td > input[type=button][name=Save]');
      await page.waitForSelector(backButtonSelector);
      console.log(`PM done! ✨`);
    }

    await page.screenshot({ path: path.join(saveDir, 'td-ss.png') });

    await browser.close();

    return path.join(saveDir, 'td-ss.png');
  } catch (error) {
    await browser?.close();
    console.log('TD Error: ' + error);
    if (typeof error === 'string') {
      return new Error(error);
    }
    if (error instanceof Error) {
      return error;
    }
  }
  return;
}

export function getTemperature() {
  return '36.' + Math.floor(Math.random() * 10);
}

function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}