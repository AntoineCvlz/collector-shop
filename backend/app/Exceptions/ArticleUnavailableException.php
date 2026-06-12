<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown during checkout when an article is no longer available for purchase.
 */
class ArticleUnavailableException extends RuntimeException {}
