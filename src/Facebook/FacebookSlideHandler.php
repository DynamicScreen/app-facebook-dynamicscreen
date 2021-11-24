<?php

namespace DynamicScreen\Facebook\Facebook;

use Carbon\Carbon;
use DynamicScreen\SdkPhp\Handlers\SlideHandler;
use DynamicScreen\SdkPhp\Interfaces\ISlide;

class FacebookSlideHandler extends SlideHandler
{
    public function fetch(ISlide $slide): void
    {
        $options = $slide->getOptions();
        $pageCount = (Integer)$options['pageCount'];
        $postCount = (Integer)$options['postCount'];

        $expiration = Carbon::now()->endOfDay();
        $cache_uuid = base64_encode(json_encode($slide->getOption('category')));
        $cache_key = $this->getIdentifier() ."_{$cache_uuid}";
        $driver = $this->getAuthProvider($slide->getAccounts());

        if ($driver == null) return;

        $page = $driver->getPage($options['pageId']);
        $posts = $driver->getPosts($options['pageId'], ($pageCount * $postCount));


        foreach (array_chunk($posts, $postCount) as $chunk) {
            $this->addSlide([
                'page' => $page,
                'posts' => $chunk,
                'theme' => $options['theme']
            ]);
        }
    }

    public function needed_accounts()
    {
        return $this->module->getOption('privileges.needs_account', false);
    }
}
