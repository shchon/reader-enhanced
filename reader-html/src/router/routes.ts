export default [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/BookshelfView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
  },
  {
    path: '/bookshelf-test',
    name: 'bookshelf-test',
    component: () => import('../views/BookshelfView.vue'),
  },
  {
    path: '/book',
    name: 'book',
    component: () => import('../pages/Book/Book.vue'),
  },
]
