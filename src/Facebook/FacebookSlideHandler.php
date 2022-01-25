<?php

namespace DynamicScreen\Facebook\Facebook;

use Carbon\Carbon;
use DynamicScreen\SdkPhp\Handlers\SlideHandler;
use DynamicScreen\SdkPhp\Interfaces\ISlide;
use Illuminate\Support\Arr;

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
//        $posts = $driver->getPosts($options['pageId'], ($pageCount * $postCount));
        $posts = $driver->getPosts($options['pageId'], ($pageCount));


//        foreach (array_chunk($posts, $postCount) as $chunk) {
//            $this->addSlide([
//                'page' => $page,
//                'posts' => $chunk,
//                'theme' => Arr::get($options, 'theme')
//            ]);
//        }

        foreach (array_chunk($posts, $postCount) as $post) {
            $this->addSlide([
                'page' => $page,
                'post' => $post,
                'theme' => Arr::get($options, 'theme', 'white')
            ]);
        }
    }
}
