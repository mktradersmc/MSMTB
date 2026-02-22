
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

const DEPLOY_SCRIPT = 'C:\\Users\\Michael\\IdeaProjects\\MSMTB\\src\\market-data-core\\scripts\\deploy_all.ps1';

export async function POST(req: Request) {
    try {
        // We accept scope but the script handles ALL currently. 
        // Future improvement: Pass scope to script if needed.
        const body = await req.json().catch(() => ({}));

        console.log(`[System] Triggering Deployment via Script: ${DEPLOY_SCRIPT}`);

        return new Promise((resolve) => {
            const ps = spawn('powershell.exe', [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', DEPLOY_SCRIPT
            ]);

            let stdout = '';
            let stderr = '';

            ps.stdout.on('data', (data) => {
                const chunk = data.toString();
                stdout += chunk;
                console.log(`[DeployScript] ${chunk.trim()}`);
            });

            ps.stderr.on('data', (data) => {
                const chunk = data.toString();
                stderr += chunk;
                console.error(`[DeployScript Error] ${chunk.trim()}`);
            });

            ps.on('close', (code) => {
                console.log(`[System] Deployment Script exited with code ${code}`);

                if (code === 0) {
                    resolve(NextResponse.json({
                        success: true,
                        message: "Deployment Script Executed Successfully",
                        output: stdout
                    }));
                } else {
                    resolve(NextResponse.json({
                        success: false,
                        error: `Script failed with code ${code}`,
                        details: stderr || stdout
                    }, { status: 500 }));
                }
            });

            ps.on('error', (err) => {
                console.error("Failed to spawn PowerShell:", err);
                resolve(NextResponse.json({
                    success: false,
                    error: "Failed to spawn PowerShell process",
                    details: err.message
                }, { status: 500 }));
            });
        });

    } catch (error: any) {
        console.error("Deployment Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
