import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react-swc'

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

// https://vite.dev/config/
export default defineConfig({
  root,
  plugins: [react()],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        schedule: resolve(root, 'schedule', 'index.html'),
        instructors: resolve(root, 'instructors', 'index.html'),
        rooms: resolve(root, 'rooms', 'index.html'),
        subjects: resolve(root, 'subjects', 'index.html'),
        curriculums: resolve(root, 'curriculums', 'index.html'),
        departments: resolve(root, 'departments', 'index.html'),
        login: resolve(root, 'login', 'index.html'),

        view_schedule: resolve(root, 'view_schedule', 'index.html'),
        view_instructors: resolve(root, 'view_instructors', 'index.html'),
      }
    }
  }
})
