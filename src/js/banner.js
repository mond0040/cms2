(function($, Drupal, window, document) {
    'use strict';
    
    Drupal.behaviors.banner = {
        attach: function(context, settings) {
            if (typeof context['location'] !== 'undefined') {  
                const banners = $('.block--banner');
                
                $.each(banners, function (index, element) {
                    let typeElement = $(element).find('.banner__type');
                    let typeText = $(typeElement)[0].innerText.trim();

                    if (typeText == 'Full (Homepage)') {
                        $(element).addClass('full');
                    }
                    else {
                        $(element).addClass('narrow');
                    }

                    $(typeElement).remove();
                });
            }
        }
    };
    
})(jQuery, Drupal, this, this.document);
