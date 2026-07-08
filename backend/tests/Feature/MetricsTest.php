<?php

use function Pest\Laravel\get;

test('the metrics endpoint returns Prometheus text format', function () {
    $response = get('/metrics');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('text/plain');
});

test('the metrics endpoint exposes business gauges', function () {
    $body = get('/metrics')->getContent();

    expect($body)
        ->toContain('collector_users_total')
        ->toContain('collector_articles_published_total')
        ->toContain('collector_articles_sold_total')
        ->toContain('collector_orders_total');
});

test('handled requests are counted in the http metrics', function () {
    get('/metrics');

    $body = get('/metrics')->getContent();

    expect($body)->toContain('collector_http_requests_total');
});
