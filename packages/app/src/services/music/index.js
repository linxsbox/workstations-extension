import http from '@/utils/http';

/**
 * Migu Music API 服务类
 * 提供音乐搜索和获取音乐链接的功能
 */
class MiguMusicService {
  constructor() {
    // Migu API 基础地址
    this.baseURL = 'https://pd.musicapp.migu.cn/MIGUM2.0/v1.0';

    // 音质类型
    this.QUALITY = {
      SQ: 'SQ', // 无损音质
      HQ: 'HQ', // 高品质
    };
  }

  /**
   * 搜索歌曲
   * @param {string} keyword - 搜索关键词
   * @param {number} pageNo - 页码，默认 1
   * @param {number} pageSize - 每页结果数，默认 20
   * @param {AbortSignal} signal - 用于取消请求的信号
   * @returns {Promise<Object>} 搜索结果
   */
  async searchSongs(keyword, pageNo = 1, pageSize = 20, signal = null) {
    try {
      const url = `${this.baseURL}/content/search_all.do`;
      const params = new URLSearchParams({
        text: keyword,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString(),
        searchSwitch: JSON.stringify({ song: 1 }), // 搜索歌曲
      });

      const response = await http.get(`${url}?${params.toString()}`, signal ? { signal } : {});

      // 提取总数并转换为数字类型
      const totalCount = parseInt(response?.songResultData?.totalCount || '0', 10);

      return {
        success: true,
        data: this._parseSongList(response),
        totalCount: totalCount,
        raw: response,
      };
    } catch (error) {
      console.error('搜索歌曲失败:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取歌词
   * @param {string} copyrightId - 版权ID
   * @returns {Promise<Object>} 歌词信息
   */
  async getLyric(copyrightId) {
    try {
      const url = `https://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${copyrightId}`;

      const response = await http.get(url, {
        headers: {
          'Referer': 'http://music.migu.cn/'
        }
      });

      if (!response || !response.lyric) {
        return {
          success: false,
          error: '未找到歌词',
          data: null,
        };
      }

      // 解析歌词
      const parsedLyric = this._parseLyric(response.lyric);

      return {
        success: true,
        data: {
          lyric: response.lyric, // 原始歌词文本
          parsed: parsedLyric, // 解析后的歌词数组
        },
      };
    } catch (error) {
      console.error('获取歌词失败:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取音乐播放链接
   * @param {string} contentId - 歌曲ID
   * @param {string} copyrightId - 版权ID
   * @param {string} quality - 音质类型 (SQ/HQ)
   * @returns {Promise<Object>} 音乐链接信息
   */
  async getMusicUrl(contentId, copyrightId, quality = this.QUALITY.HQ) {
    try {
      // 根据音质构建 API URL
      const apiUrl = this._buildMusicUrl(contentId, copyrightId, quality);

      // 调用 API 获取音频文件 URL
      const response = await http.get(apiUrl);

      // 从响应中提取音频文件 URL
      const audioUrl = this._extractAudioUrl(response);

      if (!audioUrl) {
        throw new Error('无法从响应中提取音频 URL');
      }

      return {
        success: true,
        url: audioUrl,
        quality: quality,
        contentId: contentId,
      };
    } catch (error) {
      console.error('获取音乐链接失败:', error);
      return {
        success: false,
        error: error.message,
        url: null,
      };
    }
  }

  /**
   * 解析歌词文本为时间轴数组
   * @private
   * @param {string} lyricText - 歌词文本
   * @returns {Array} 解析后的歌词数组 [{time: number, text: string}]
   */
  _parseLyric(lyricText) {
    if (!lyricText) return [];

    const lines = lyricText.split('\n');
    const lyricArray = [];

    // 正则匹配时间标签 [mm:ss.ms] 或 [mm:ss]
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    lines.forEach(line => {
      const matches = [...line.matchAll(timeRegex)];
      if (matches.length === 0) return;

      // 提取歌词文本（去除所有时间标签）
      const text = line.replace(timeRegex, '').trim();
      if (!text) return;

      // 一行可能有多个时间标签
      matches.forEach(match => {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

        const time = minutes * 60 + seconds + milliseconds / 1000;

        lyricArray.push({
          time,
          text,
        });
      });
    });

    // 按时间排序
    lyricArray.sort((a, b) => a.time - b.time);

    return lyricArray;
  }

  /**
   * 从 API 响应中提取音频文件 URL
   * @private
   * @param {Object} response - API 响应数据
   * @returns {string|null} 音频文件 URL
   */
  _extractAudioUrl(response) {
    // 尝试从不同的可能字段中提取 URL
    if (response.data && response.data.url) {
      return response.data.url;
    }
    if (response.url) {
      return response.url;
    }
    if (response.playUrl) {
      return response.playUrl;
    }
    if (response.listenUrl) {
      return response.listenUrl;
    }
    // 如果有 data 对象，尝试从中查找
    if (response.data) {
      const data = response.data;
      if (data.playUrl) return data.playUrl;
      if (data.listenUrl) return data.listenUrl;
      if (data.mp3Url) return data.mp3Url;
      if (data.flacUrl) return data.flacUrl;
    }
    return null;
  }

  /**
   * 构建音乐播放链接
   * @private
   * @param {string} contentId - 歌曲ID
   * @param {string} copyrightId - 版权ID
   * @param {string} quality - 音质类型
   * @returns {string} 音乐链接
   */
  _buildMusicUrl(contentId, copyrightId, quality) {
    // 根据音质确定 formatType 和 resourceType
    // HQ: formatType=HQ, resourceType=2
    // SQ: formatType=SQ, resourceType=E
    const formatType = quality === this.QUALITY.SQ ? this.QUALITY.SQ : this.QUALITY.HQ;
    const resourceType = quality === this.QUALITY.SQ ? 'E' : '2';

    // 构建播放链接
    const params = new URLSearchParams({
      toneFlag: formatType,
      netType: '00',
      userId: '15548614588710179085069',
      ua: 'Android_migu',
      version: '5.1',
      copyrightId: copyrightId,
      contentId: contentId,
      resourceType: resourceType,
      channel: '0',
    });

    return `https://app.pd.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do?${params.toString()}`;
  }

  /**
   * 解析歌曲列表数据
   * @private
   * @param {Object} response - API 响应数据
   * @returns {Array} 格式化后的歌曲列表
   */
  _parseSongList(response) {
    if (!response || !response.songResultData || !response.songResultData.result) {
      return [];
    }

    const songs = response.songResultData.result;

    return songs.map(song => {
      // 尝试从多个可能的字段获取艺人信息
      let artist = '未知艺人';

      // 优先级顺序：singers > singer > singerName > artistName > artist
      if (Array.isArray(song.singers) && song.singers.length > 0) {
        // singers 是数组，提取所有艺人名称并用 / 连接
        artist = song.singers.map(s => s.name || s.singerName).filter(Boolean).join(' / ');
      } else if (song.singer) {
        artist = Array.isArray(song.singer)
          ? song.singer.map(s => s.name || s).filter(Boolean).join(' / ')
          : song.singer;
      } else if (song.singerName) {
        artist = song.singerName;
      } else if (song.artistName) {
        artist = song.artistName;
      } else if (song.artist) {
        artist = song.artist;
      }

      // 获取封面图片：从 imgItems 中取 imgSizeType 为 "01" 的（最小尺寸）
      let cover = '';
      if (Array.isArray(song.imgItems) && song.imgItems.length > 0) {
        const smallImg = song.imgItems.find(item => item.imgSizeType === '01');
        cover = smallImg?.img || song.imgItems[0]?.img || '';
      }

      // 获取专辑名称
      let album = '';
      if (Array.isArray(song.albums) && song.albums.length > 0) {
        album = song.albums[0]?.name || '';
      } else {
        album = song.album || song.albumName || song.albumTitle || '';
      }

      // 检查是否是 VIP 歌曲
      const isVip = song.vipType === '1';

      return {
        id: song.id || song.contentId,
        contentId: song.contentId,
        copyrightId: song.copyrightId,
        name: song.name || song.songName || song.title,
        artist: artist || '未知艺人',
        album: album,
        cover: cover,
        lyricUrl: song.lyricUrl || '',
        isVip: isVip,
        // 保留原始数据
        raw: song,
      };
    });
  }
}

// 导出单例
export const miguMusicService = new MiguMusicService();

// 也导出类本身，以便需要时创建新实例
export default MiguMusicService;
