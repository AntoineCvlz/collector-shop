<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Contrôle les en-têtes CORS renvoyés par l'application. Par défaut Laravel
    | autorise toutes les origines ('*'), ce que le scan DAST/ZAP signale comme
    | "Cross-Domain Misconfiguration". On restreint donc les origines autorisées.
    |
    | En production, front et back partagent la même origine (cf. edge nginx),
    | donc CORS n'est en pratique pas nécessaire ; on liste malgré tout les
    | origines légitimes via CORS_ALLOWED_ORIGINS (valeurs séparées par des
    | virgules), avec APP_URL comme valeur de repli.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', env('APP_URL', 'http://localhost')))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
