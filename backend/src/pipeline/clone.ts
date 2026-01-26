// Step 2: Clone repository to temporary directory
import { PipelineStep, PipelineContext } from './orchestrator';
import { getRepoSize } from '../services/github';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const MAX_REPO_SIZE_MB = parseInt(process.env.MAX_REPO_SIZE_MB || '1024', 10);
const TEMP_DIR = process.env.TEMP_DIR || path.join(os.tmpdir(), 'giteval');

export class CloneStep implements PipelineStep {
  name = 'Clone';

  async execute(context: PipelineContext): Promise<void> {
    const { owner, repo, commitSha } = context;

    try {
      // Check repository size before cloning
      const sizeInKB = await getRepoSize(owner, repo);
      const sizeInMB = sizeInKB / 1024;

      if (sizeInMB > MAX_REPO_SIZE_MB) {
        throw new Error(
          `Repository size (${sizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${MAX_REPO_SIZE_MB}MB)`
        );
      }

      console.log(`[Clone] Repository size: ${sizeInMB.toFixed(2)}MB`);

      // Create temporary directory
      await fs.mkdir(TEMP_DIR, { recursive: true });

      // Generate unique clone path
      const clonePath = path.join(TEMP_DIR, `${owner}-${repo}-${Date.now()}`);
      context.clonePath = clonePath;

      console.log(`[Clone] Cloning ${owner}/${repo} to ${clonePath}`);

      // Clone repository
      const repoUrl = `https://github.com/${owner}/${repo}.git`;
      const cloneCommand = `git clone --depth 1 "${repoUrl}" "${clonePath}"`;

      await execAsync(cloneCommand, {
        timeout: 120000, // 2 minute timeout
      });

      // Verify clone was successful
      const stats = await fs.stat(clonePath);
      if (!stats.isDirectory()) {
        throw new Error('Clone failed - path is not a directory');
      }

      // Count files
      const { stdout: fileCount } = await execAsync(
        `find "${clonePath}" -type f | wc -l`,
        { timeout: 30000 }
      );

      const numFiles = parseInt(fileCount.trim(), 10);
      const maxFiles = parseInt(process.env.MAX_FILES || '10000', 10);

      if (numFiles > maxFiles) {
        throw new Error(
          `Repository has too many files (${numFiles}), maximum allowed is ${maxFiles}`
        );
      }

      console.log(`[Clone] Successfully cloned ${numFiles} files`);

      context.data.clonePath = clonePath;
      context.data.fileCount = numFiles;

    } catch (error: any) {
      console.error('[Clone] Failed to clone repository:', error);
      throw new Error(`Clone failed: ${error.message}`);
    }
  }
}
