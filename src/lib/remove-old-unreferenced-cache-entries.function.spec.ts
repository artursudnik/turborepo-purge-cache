import fs from 'node:fs';
import path from 'node:path';
import { getOldCacheEntriesHashes } from './get-old-cache-entries-hashes.function';
import { getRunTasksHashes } from './get-run-tasks-hashes.function';
import { removeOldUnreferencedCacheEntries } from './remove-old-unreferenced-cache-entries.function';

jest.mock('node:fs', () => ({
  promises: {
    readdir: jest.fn(),
    rm: jest.fn(),
  },
}));

jest.mock('./get-old-cache-entries-hashes.function', () => ({
  getOldCacheEntriesHashes: jest.fn(),
}));

jest.mock('./get-run-tasks-hashes.function', () => ({
  getRunTasksHashes: jest.fn(),
}));

describe('removeOldUnreferencedCacheEntries', () => {
  const turboFolder = 'turbo-root';
  const daysTTL = 7;
  const runsPath = path.join(turboFolder, 'runs');
  const cacheFolder = path.join(turboFolder, 'cache');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should remove unreferenced old cache entries and keep referenced ones', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      'run1.json',
      'run2.json',
    ]);

    (getRunTasksHashes as jest.Mock)
      .mockResolvedValueOnce(['hash-referenced-1'])
      .mockResolvedValueOnce(['hash-referenced-2']);

    (getOldCacheEntriesHashes as jest.Mock).mockResolvedValue([
      'hash-referenced-1',
      'hash-unreferenced-1',
      'hash-unreferenced-2',
    ]);

    (fs.promises.rm as jest.Mock).mockResolvedValue(undefined);

    await removeOldUnreferencedCacheEntries({ turboFolder, daysTTL });

    expect(fs.promises.readdir).toHaveBeenCalledWith(runsPath);
    expect(getRunTasksHashes).toHaveBeenCalledTimes(2);
    expect(getOldCacheEntriesHashes).toHaveBeenCalledWith({
      cacheFolder,
      daysTTL,
    });

    expect(fs.promises.rm).toHaveBeenCalledTimes(4); // 2 files per hash (tar.zst and -meta.json)

    expect(fs.promises.rm).toHaveBeenCalledWith(
      path.join(cacheFolder, 'hash-unreferenced-1.tar.zst'),
    );

    expect(fs.promises.rm).toHaveBeenCalledWith(
      path.join(cacheFolder, 'hash-unreferenced-1-meta.json'),
    );

    expect(fs.promises.rm).toHaveBeenCalledWith(
      path.join(cacheFolder, 'hash-unreferenced-2.tar.zst'),
    );

    expect(fs.promises.rm).toHaveBeenCalledWith(
      path.join(cacheFolder, 'hash-unreferenced-2-meta.json'),
    );

    // Should NOT remove referenced one
    expect(fs.promises.rm).not.toHaveBeenCalledWith(
      path.join(cacheFolder, 'hash-referenced-1.tar.zst'),
    );
  });

  it('should do nothing if no old cache entries are found', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    (getOldCacheEntriesHashes as jest.Mock).mockResolvedValue([]);

    await removeOldUnreferencedCacheEntries({ turboFolder, daysTTL });

    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should do nothing if all old cache entries are referenced', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue(['run1.json']);
    (getRunTasksHashes as jest.Mock).mockResolvedValue(['hash1']);
    (getOldCacheEntriesHashes as jest.Mock).mockResolvedValue(['hash1']);

    await removeOldUnreferencedCacheEntries({ turboFolder, daysTTL });

    expect(fs.promises.rm).not.toHaveBeenCalled();
  });

  it('should handle and log errors when file deletion fails', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    (getOldCacheEntriesHashes as jest.Mock).mockResolvedValue(['hash-fail']);
    const error = new Error('Permission denied');
    (fs.promises.rm as jest.Mock).mockRejectedValue(error);

    await removeOldUnreferencedCacheEntries({ turboFolder, daysTTL });

    expect(console.error).toHaveBeenCalledWith('Failed to remove 2 file(s):', [
      'hash-fail.tar.zst',
      'hash-fail-meta.json',
    ]);

    expect(console.error).toHaveBeenCalledWith(
      'Error removing hash-fail.tar.zst:',
      error,
    );

    expect(console.error).toHaveBeenCalledWith(
      'Error removing hash-fail-meta.json:',
      error,
    );
  });

  it('should propagate errors from fs.promises.readdir', async () => {
    const error = new Error('Read error');
    (fs.promises.readdir as jest.Mock).mockRejectedValue(error);

    await expect(
      removeOldUnreferencedCacheEntries({ turboFolder, daysTTL }),
    ).rejects.toThrow('Read error');
  });

  it('should propagate errors from getRunTasksHashes', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue(['run1.json']);
    const error = new Error('Parse error');
    (getRunTasksHashes as jest.Mock).mockRejectedValue(error);

    await expect(
      removeOldUnreferencedCacheEntries({ turboFolder, daysTTL }),
    ).rejects.toThrow('Parse error');
  });

  it('should propagate errors from getOldCacheEntriesHashes', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    const error = new Error('Stat error');
    (getOldCacheEntriesHashes as jest.Mock).mockRejectedValue(error);

    await expect(
      removeOldUnreferencedCacheEntries({ turboFolder, daysTTL }),
    ).rejects.toThrow('Stat error');
  });
});
