(function($, Drupal, window, document) {
    'use strict';
    
    Drupal.behaviors.copyright = {
        attach: function(context, settings) {
            if (typeof context['location'] !== 'undefined') {
                const show = $('.footer__show-cr')[0].innerText.trim();

                if (show == 'On' && !($('body').hasClass('path-frontpage'))) {
                    $('.footer__copyright').remove();
                    $('.block--footer-block').addClass('no-copyright');
                }

                $('.footer__show-cr').remove();
            }
        }
    };
    
})(jQuery, Drupal, this, this.document);
