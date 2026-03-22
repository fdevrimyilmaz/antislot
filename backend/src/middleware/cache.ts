/**
 * Cache-Control and ETag middleware helpers for Fastify.
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { generateETag } from "../utils/signature";

/**
 * Setup ETag and conditional 304 handling.
 */
export function setupCacheMiddleware(fastify: FastifyInstance): void {
  fastify.addHook(
    "onSend",
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      // Only process GET responses.
      if (request.method !== "GET") {
        return payload;
      }

      const ifNoneMatch = request.headers["if-none-match"];
      const etagSource =
        typeof payload === "string" || (payload !== null && typeof payload === "object")
          ? payload
          : payload == null
            ? ""
            : String(payload);
      const etag = generateETag(etagSource);
      reply.header("ETag", etag);

      if (ifNoneMatch === etag || (Array.isArray(ifNoneMatch) && ifNoneMatch.includes(etag))) {
        reply.code(304);
        return "";
      }

      return payload;
    }
  );
}

/**
 * Set Cache-Control response header.
 */
export function setCacheControl(reply: FastifyReply, cacheControl: string): void {
  reply.header("Cache-Control", cacheControl);
}
