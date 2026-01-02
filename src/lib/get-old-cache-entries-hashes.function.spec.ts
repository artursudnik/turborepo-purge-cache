import fs from 'node:fs';
import path from 'node:path';
import { getOldCacheEntriesHashes } from './get-old-cache-entries-hashes.function';

jest.mock('node:fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
  },
}));

describe('getOldCacheEntriesHashes', () => {
  const cacheFolder = 'path/to/cache';
  const daysTTL = 7;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return hashes of old cache entries', async () => {
    const files = [
      'abc-meta.json',
      'def-meta.json',
      'ghi.txt',
      'jkl-meta.json',
    ];
    (fs.promises.readdir as jest.Mock).mockResolvedValue(files);

    const oldDate = new Date('2025-12-20T12:00:00Z'); // Older than 7 days
    const newDate = new Date('2026-01-01T12:00:00Z'); // Newer than 7 days

    (fs.promises.stat as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('abc-meta.json'))
        return Promise.resolve({ mtime: oldDate });
      if (filePath.includes('def-meta.json'))
        return Promise.resolve({ mtime: newDate });
      if (filePath.includes('jkl-meta.json'))
        return Promise.resolve({ mtime: oldDate });
      return Promise.reject(new Error('File not found'));
    });

    const result = await getOldCacheEntriesHashes({ cacheFolder, daysTTL });

    expect(result).toEqual(['abc', 'jkl']);
    expect(fs.promises.readdir).toHaveBeenCalledWith(cacheFolder);
    expect(fs.promises.stat).toHaveBeenCalledTimes(3);
    expect(fs.promises.stat).toHaveBeenCalledWith(
      path.join(cacheFolder, 'abc-meta.json'),
    );
    expect(fs.promises.stat).toHaveBeenCalledWith(
      path.join(cacheFolder, 'def-meta.json'),
    );
    expect(fs.promises.stat).toHaveBeenCalledWith(
      path.join(cacheFolder, 'jkl-meta.json'),
    );
  });

  it('should return an empty array if no files match the criteria', async () => {
    const files = ['new-meta.json'];
    (fs.promises.readdir as jest.Mock).mockResolvedValue(files);

    const newDate = new Date('2026-01-01T12:00:00Z');
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtime: newDate });

    const result = await getOldCacheEntriesHashes({ cacheFolder, daysTTL });

    expect(result).toEqual([]);
  });

  it('should return an empty array if the cache folder is empty', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);

    const result = await getOldCacheEntriesHashes({ cacheFolder, daysTTL });

    expect(result).toEqual([]);
    expect(fs.promises.stat).not.toHaveBeenCalled();
  });

  it('should ignore files that do not end with -meta.json', async () => {
    const files = ['some-file.json', 'other-meta.js', 'valid-meta.json'];
    (fs.promises.readdir as jest.Mock).mockResolvedValue(files);

    const oldDate = new Date('2025-12-20T12:00:00Z');
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtime: oldDate });

    const result = await getOldCacheEntriesHashes({ cacheFolder, daysTTL });

    expect(result).toEqual(['valid']);
    expect(fs.promises.stat).toHaveBeenCalledTimes(1);
    expect(fs.promises.stat).toHaveBeenCalledWith(
      path.join(cacheFolder, 'valid-meta.json'),
    );
  });

  it('should propagate errors from fs.promises.readdir', async () => {
    const error = new Error('Readdir failed');
    (fs.promises.readdir as jest.Mock).mockRejectedValue(error);

    await expect(
      getOldCacheEntriesHashes({ cacheFolder, daysTTL }),
    ).rejects.toThrow('Readdir failed');
  });

  it('should propagate errors from fs.promises.stat', async () => {
    const files = ['abc-meta.json'];
    (fs.promises.readdir as jest.Mock).mockResolvedValue(files);
    const error = new Error('Stat failed');
    (fs.promises.stat as jest.Mock).mockRejectedValue(error);

    await expect(
      getOldCacheEntriesHashes({ cacheFolder, daysTTL }),
    ).rejects.toThrow('Stat failed');
  });
});
