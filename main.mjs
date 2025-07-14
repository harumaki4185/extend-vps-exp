import puppeteer from 'puppeteer'
import { setTimeout } from 'node:timers/promises'

async function sendDiscordWebhook(message) {
    const webhookUrl = process.env.WEBHOOK_URL
    if (!webhookUrl) {
        console.log('Discord webhook URL not configured')
        return
    }
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message
            })
        })
        
        if (!response.ok) {
            console.error(`Discord webhook failed: ${response.status}`)
        }
    } catch (error) {
        console.error('Error sending Discord webhook:', error)
    }
}

const browser = await puppeteer.launch({
    defaultViewport: { width: 1080, height: 1024 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const [page] = await browser.pages()
const recorder = await page.screencast({ path: 'recording.webm' })

try {
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' })
    await page.locator('#memberid').fill(process.env.EMAIL)
    await page.locator('#user_password').fill(process.env.PASSWORD)
    await page.locator('text=ログインする').click()
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await page.goto('https://secure.xserver.ne.jp/xapanel/xvps/index', { waitUntil: 'networkidle2' })
    await page.locator('.contract__menuIcon').click()
    await page.locator('text=契約情報').click()
    await page.locator('text=更新する').click()
    await page.locator('text=引き続き無料VPSの利用を継続する').click()
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await page.locator('text=無料VPSの利用を継続する').click()
    
    await sendDiscordWebhook(`更新が正常に完了 (${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })})`)
} catch (e) {
    console.error(e)
    await sendDiscordWebhook(`更新エラーが発生 GithubActionsを確認してください: ${e.message} (${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })})`)
} finally {
    await setTimeout(5000)
    await recorder.stop()
    await browser.close()
}
