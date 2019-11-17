(function ($, Drupal, window, document) {
    'use strict';

    Drupal.behaviors.socialMedia = {
        attach: function (context, settings) {
            if (typeof context['location'] !== 'undefined') {
                const socialItems = $('.social__item');

                $.each(socialItems, function (index, element) {
                    let socialURLElement = $(element).find('.social__link');
                    let socialURL = $(socialURLElement).find('a').attr('href');

                    let socialColourElement = $(element).find('.social__colour');
                    let socialColour = $(socialColourElement)[0].innerText.trim();

                    let socialIcon = $(element).find('.social__icon');

                    $(socialIcon).css('fill', socialColour);
                    $(socialIcon).wrap(`<a href='${socialURL}' class='social__link-container'></a>`);

                    $(socialURLElement).remove();
                    $(socialColourElement).remove();
                });
            }
        }
    };
})(jQuery, Drupal, this, this.document);