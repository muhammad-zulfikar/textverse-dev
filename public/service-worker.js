self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) {
          throw new Error('Network response was not ok');
        }
        return response;
      })
      .catch(async () => {
        const response = await caches.match(event.request);
        return response || new Response('Offline');
      })
  );
});
