import fs from 'fs'
import { spawn } from 'child_process'
import color from 'console-log-colors'
import { getErrorMessage } from './utils/errorMessage'

export function createDockerfile(path: string, scale: number = 20): void {

    const dockerfile = `
    FROM node:18

    WORKDIR /app

    COPY package*.json ./

    RUN npm install

    RUN apt update && apt install -y ffmpeg

    COPY . .

    CMD ["npx", "resize", "${path}", "-s", "${scale}"]
    `

    fs.writeFile('./.dockerignore', 'node_modules\ndist\n**/.DS_Store', (err) => {
        if(err) {
            console.error(getErrorMessage(err))
        }
    })

    fs.writeFile(`./Dockerfile.dev`, dockerfile, (err) => {
        if(err) {
            console.error(getErrorMessage(err))
        }

        console.log(color.cyanBright(`✨ 🐳 Dockerfile created!`))

        buildImage(path)
    })
}

function buildImage(path: string): void {
    const buildCmd = `docker build -t resizecli-image -f ./Dockerfile.dev .`
    console.log(color.yellow('building image...'), color.dim(buildCmd))

    const buildArgs = buildCmd.split(' ').splice(1)
    const build = spawn('docker', buildArgs, {stdio: 'inherit'})

    build.on('close', (code) => {
        if(code === 0) {
            console.log('\n')
            runImage(path)
        }
    })
}

function runImage(path: string) {
    const runCmd = `docker run --rm -v .:/app resizecli-image`
    console.log(color.yellow('running image...'), color.dim(runCmd))

    const runArgs = runCmd.split(' ').splice(1)
    const run = spawn('docker', runArgs, {stdio: 'inherit'})

    run.on('close', (code, signal) => {
        if(code === 0) {
            console.log(color.green(`process exited successfully with code: ${code}`))
        } else {
            console.log(color.red(`process exited with code: ${code}\nsignal: ${signal}`))
        }
    })
}