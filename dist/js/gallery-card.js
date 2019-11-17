(function ($, Drupal, window, document) {
  'use strict';

  Drupal.behaviors.galleryCard = {
    attach: function (context, settings) {
      if (typeof context['location'] !== 'undefined') {
        // Image press functionality
        $('.gallery__image-container article').click(e => {
          const imgURL = $(e.target).find('img').attr('src');

          $('body').prepend(`
              <div class="g__zoomed-background">
                <div class="g__zoomed-close">&#10005;</div>
              </div>
              <div class="g__zoomed-image" style="background-image: url('${imgURL}')"></div>
            `);

          if ($('body').hasClass('toolbar-fixed')) {
            $('.g__zoomed-close').css('top', '25%');
          }

          $('.g__zoomed-close').fadeIn();
          $('.g__zoomed-background').fadeIn();
          $('.g__zoomed-image').fadeIn();
        });

        // Close button functionality (image has already been pressed)
        $(document).click(function (e) {
          if ($(e.target).hasClass('g__zoomed-close')) {
            $('.g__zoomed-close').fadeOut();
            $('.g__zoomed-background').fadeOut();
            $('.g__zoomed-image').fadeOut('fast', () => {
              $('.g__zoomed-close').remove();
              $('.g__zoomed-background').remove();
              $('.g__zoomed-image').remove();
            });
          }
        });
      }
    }
  };
})(jQuery, Drupal, this, this.document);