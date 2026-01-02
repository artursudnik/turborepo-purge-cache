import fs from 'node:fs';
import { folderExistsAndIsReadable } from './folder-exists-and-is-readable.function';

jest.mock('node:fs', () => ({
  promises: {
    access: jest.fn(),
    stat: jest.fn(),
  },
  constants: {
    R_OK: 4,
  },
}));

describe('folderExistsAndIsReadable', () => {
  const targetPath = 'path/to/folder';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when the folder exists and is readable', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.stat as jest.Mock).mockResolvedValue({
      isDirectory: () => true,
    });

    const result = await folderExistsAndIsReadable(targetPath);

    expect(result).toBe(true);
    expect(fs.promises.access).toHaveBeenCalledWith(
      targetPath,
      fs.constants.R_OK,
    );
    expect(fs.promises.stat).toHaveBeenCalledWith(targetPath);
  });

  it('should return false when access fails (e.g., path does not exist or not readable)', async () => {
    (fs.promises.access as jest.Mock).mockRejectedValue(
      new Error('Access denied'),
    );

    const result = await folderExistsAndIsReadable(targetPath);

    expect(result).toBe(false);
  });

  it('should return false when the path exists but is not a directory', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.stat as jest.Mock).mockResolvedValue({
      isDirectory: () => false,
    });

    const result = await folderExistsAndIsReadable(targetPath);

    expect(result).toBe(false);
  });

  it('should return false when stat fails', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.stat as jest.Mock).mockRejectedValue(new Error('Stat failed'));

    const result = await folderExistsAndIsReadable(targetPath);

    expect(result).toBe(false);
  });
});
