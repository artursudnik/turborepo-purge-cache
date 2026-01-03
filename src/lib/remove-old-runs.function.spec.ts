import fs from 'node:fs';
import path from 'node:path';
import { folderExistsAndIsReadable } from './folder-exists-and-is-readable.function';
import { removeOldRuns } from './remove-old-runs.function';

jest.mock('./folder-exists-and-is-readable.function');

jest.mock('node:fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    rm: jest.fn(),
  },
}));

describe('removeOldRuns', () => {
  const runsFolder = 'path/to/runs';
  const daysTTL = 7;
  const now = new Date('2026-01-02T13:54:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    (folderExistsAndIsReadable as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should remove runs older than TTL and keep newer ones', async () => {
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 10);
    const newDate = new Date(now);
    newDate.setDate(newDate.getDate() - 2);

    const oldRunFile = 'old-run.json';
    const newRunFile = 'new-run.json';

    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      oldRunFile,
      newRunFile,
    ]);

    (fs.promises.readFile as jest.Mock).mockImplementation(
      (filePath: string) => {
        if (filePath.endsWith(oldRunFile)) {
          return Promise.resolve(
            JSON.stringify({ execution: { startTime: oldDate.getTime() } }),
          );
        }
        if (filePath.endsWith(newRunFile)) {
          return Promise.resolve(
            JSON.stringify({ execution: { startTime: newDate.getTime() } }),
          );
        }
        return Promise.reject(new Error('File not found'));
      },
    );

    (fs.promises.rm as jest.Mock).mockResolvedValue(undefined);

    await removeOldRuns({ runsFolder, daysTTL });

    expect(fs.promises.rm).toHaveBeenCalledWith(
      path.join(runsFolder, oldRunFile),
    );
    expect(fs.promises.rm).not.toHaveBeenCalledWith(
      path.join(runsFolder, newRunFile),
    );
    expect(console.log).toHaveBeenCalledWith(
      'Removing 1 runs older than 7 days.',
    );
  });

  it('should handle invalid JSON in run files', async () => {
    const runFile = 'invalid.json';
    (fs.promises.readdir as jest.Mock).mockResolvedValue([runFile]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue('invalid json');

    await removeOldRuns({ runsFolder, daysTTL });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'WARNING - could not read or parse run file: invalid.json',
      ),
    );
    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should handle invalid schema in run files', async () => {
    const runFile = 'invalid-schema.json';

    (fs.promises.readdir as jest.Mock).mockResolvedValue([runFile]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ wrong: 'schema' }),
    );

    await removeOldRuns({ runsFolder, daysTTL });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'WARNING - invalid run file format: invalid-schema.json',
      ),
    );
    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should handle file system errors when reading directory', async () => {
    (fs.promises.readdir as jest.Mock).mockRejectedValue(
      new Error('Readdir failed'),
    );

    await expect(removeOldRuns({ runsFolder, daysTTL })).rejects.toThrow(
      'Readdir failed',
    );
  });

  it('should handle file system errors when deleting a file', async () => {
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 10);
    const oldRunFile = 'old-run.json';

    (fs.promises.readdir as jest.Mock).mockResolvedValue([oldRunFile]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ execution: { startTime: oldDate.getTime() } }),
    );
    (fs.promises.rm as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    await removeOldRuns({ runsFolder, daysTTL });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'WARNING - could not delete run file: old-run.json: Delete failed',
      ),
    );
  });

  it('should do nothing if no runs are found', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);

    await removeOldRuns({ runsFolder, daysTTL });

    expect(console.log).toHaveBeenCalledWith('Found 0 runs.');
    expect(console.log).toHaveBeenCalledWith(
      'No runs older than 7 days found.',
    );
    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should log a message and return if the runs folder does not exist', async () => {
    (folderExistsAndIsReadable as jest.Mock).mockResolvedValue(false);

    await removeOldRuns({ runsFolder, daysTTL });

    expect(console.log).toHaveBeenCalledWith(
      `No runs folder found at ${runsFolder}.`,
    );
    expect(fs.promises.readdir).not.toHaveBeenCalled();
  });
});
