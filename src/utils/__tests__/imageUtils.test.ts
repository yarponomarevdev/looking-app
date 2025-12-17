/**
 * Тесты для валидации изображений
 * Проверяем работу с Data URL и обычными URI
 */

import { validateImage, getFileExtension, getMimeTypeFromUri } from '../imageUtils';

describe('imageUtils - валидация', () => {
  describe('getFileExtension', () => {
    it('должен извлекать расширение из обычного URI', () => {
      expect(getFileExtension('file:///path/to/image.jpg')).toBe('jpg');
      expect(getFileExtension('file:///path/to/image.png')).toBe('png');
      expect(getFileExtension('file:///path/to/image.heic')).toBe('heic');
    });

    it('должен извлекать расширение из Data URL', () => {
      expect(getFileExtension('data:image/jpeg;base64,/9j/4AAQ...')).toBe('jpg');
      expect(getFileExtension('data:image/png;base64,iVBORw0KGg...')).toBe('png');
      expect(getFileExtension('data:image/webp;base64,UklGRi...')).toBe('webp');
    });

    it('должен работать с URI с параметрами', () => {
      expect(getFileExtension('file:///image.jpg?v=123')).toBe('jpg');
    });
  });

  describe('getMimeTypeFromUri', () => {
    it('должен извлекать MIME-тип из Data URL', () => {
      expect(getMimeTypeFromUri('data:image/jpeg;base64,/9j/4AAQ...')).toBe('image/jpeg');
      expect(getMimeTypeFromUri('data:image/png;base64,iVBORw0KGg...')).toBe('image/png');
    });

    it('должен возвращать MIME-тип по расширению для обычного URI', () => {
      expect(getMimeTypeFromUri('file:///image.jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromUri('file:///image.png')).toBe('image/png');
    });
  });

  describe('validateImage', () => {
    it('должен принимать поддерживаемые форматы (Data URL)', () => {
      expect(validateImage('data:image/jpeg;base64,/9j/4AAQ...').isValid).toBe(true);
      expect(validateImage('data:image/png;base64,iVBORw0KGg...').isValid).toBe(true);
      expect(validateImage('data:image/webp;base64,UklGRi...').isValid).toBe(true);
    });

    it('должен принимать поддерживаемые форматы (обычный URI)', () => {
      expect(validateImage('file:///image.jpg').isValid).toBe(true);
      expect(validateImage('file:///image.png').isValid).toBe(true);
      expect(validateImage('file:///image.heic').isValid).toBe(true);
    });

    it('должен отклонять неподдерживаемые форматы', () => {
      const result = validateImage('file:///document.pdf');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('PDF');
    });

    it('должен отклонять не-изображения в Data URL', () => {
      const result = validateImage('data:application/pdf;base64,JVBERi0xLjQ...');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('не является изображением');
    });

    it('должен отклонять пустой URI', () => {
      const result = validateImage('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Файл не выбран');
    });
  });
});


