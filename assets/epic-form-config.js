window.EPIC_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVwGX70-fL-QM1nfKqlSyNdrh0hq_CFwBsKvwYgZ_AEbJL6oLufGXzLLqP6zGEtlCN/exec";

(function(){
  const EPIC_STATIC_PAGE_IMAGE = "https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6a653122666f9dc90b2b1d36.webp";
  function swapStaticImages(){
    document.querySelectorAll('.hero-logo-mark img, img[src*="Make%20(1920"], img[src*="Make (1920"]').forEach(img => {
      img.src = EPIC_STATIC_PAGE_IMAGE;
      img.alt = 'EPIC Bikini Contest at Tailgate Beach Club';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      swapStaticImages();
      setTimeout(swapStaticImages, 100);
      setTimeout(swapStaticImages, 600);
    });
  } else {
    swapStaticImages();
    setTimeout(swapStaticImages, 100);
    setTimeout(swapStaticImages, 600);
  }
})();
