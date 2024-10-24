/*
(layout) // 要跳脫
  about
    page.tsx
  layout.tsx // 裡面要自己放 <Outlet />
  page.tsx
login
  page.tsx

↑ ↑ ↑ ↑ ↑ ↑
[Routes, Route, [Route, Route, Route]]

↑ ↑ ↑ ↑ ↑ ↑
/      > (layout)/page.tsx
/about > (layout)/about/page.tsx
/login > login/page.tsx

<Routes>
  <Route path="/login" element={<Page />} />
  <Route path="/" element={<Layout />}>
    <Route index element={<Page />} />
    <Route path="about" element={<Page />} />
  </Route>
</Routes>
*/
