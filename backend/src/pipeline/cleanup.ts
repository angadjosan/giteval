// Step 14: Cleanup - remove temporary files
import { PipelineStep, PipelineContext } from './orchestrator';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CleanupStep implements PipelineStep {
  name = 'Cleanup';

  async execute(context: PipelineContext): Promise<void> {
    const { clonePath } = context;

    try {
      console.log('[Cleanup] Cleaning up temporary files');

      if (clonePath) {
        // Remove cloned repository
        try {
          await execAsync(`rm -rf "${clonePath}"`, { timeout: 30000 });
          console.log('[Cleanup] Removed cloned repository:', clonePath);
        } catch (error) {
          console.error('[Cleanup] Failed to remove clone path:', error);
          // Try alternative method
          try {
            await fs.rm(clonePath, { recursive: true, force: true });
            console.log('[Cleanup] Removed cloned repository (alternative method):', clonePath);
          } catch (altError) {
            console.error('[Cleanup] Alternative cleanup method also failed:', altError);
          }
        }
      }

      // Clear clone path from context
      delete context.clonePath;
      delete context.data.clonePath;

      console.log('[Cleanup] Cleanup complete');

    } catch (error: any) {
      console.error('[Cleanup] Cleanup failed:', error);
      // Don't throw - cleanup failure shouldn't stop pipeline completion
      console.warn('[Cleanup] Continuing despite cleanup failure');
    }
  }
}
