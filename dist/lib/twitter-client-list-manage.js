// ABOUTME: Mixin for Twitter List management GraphQL mutations.
// ABOUTME: Provides methods to create/delete lists and add/remove members.
// ADDED BY: Aegis Research Group (dannywmarks/bird-cli)
import { TWITTER_API_BASE } from './twitter-client-constants.js';
import { buildListsFeatures } from './twitter-client-features.js';

export function withListManage(Base) {
    class TwitterClientListManage extends Base {

        /**
         * Retries a function with fallback headers on failure or DecodeException.
         * @param {Function} fn - Async function that accepts headers and returns a fetch Response.
         * @returns {Promise<{success: boolean, response?: Response, error?: string}>}
         */
        async retryWithFallbackHeaders(fn) {
            const primaryHeaders = this.getHeaders();

            let response = await fn(primaryHeaders);
            if (response.ok) {
                return { success: true, response };
            }

            // Read body to check for DecodeException
            const text = await response.text();
            if (text.includes('DecodeException')) {
                console.warn('DecodeException detected. Retrying with fallback headers...');
                // Build fallback headers — tweak User-Agent so the server treats it as a fresh request
                const fallbackHeaders = { ...primaryHeaders };
                if (fallbackHeaders['User-Agent']) {
                    fallbackHeaders['User-Agent'] += ' Retry';
                }
                response = await fn(fallbackHeaders);
                if (response.ok) {
                    return { success: true, response };
                }
                return { success: false, error: `Retry failed with status: ${response.status}`, response };
            }

            return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}`, response };
        }

        constructor(...args) {
            super(...args);
        }

        /**
         * Create a new Twitter list
         */
        async createList(name, description = '', isPrivate = true) {
            await this.ensureClientUserId();

            const variables = { isPrivate, name, description };
            const queryIds = ['CzrvV0ePRFW1dPgLY6an7g'];

            let lastError;
            for (const queryId of queryIds) {
                const url = `${TWITTER_API_BASE}/${queryId}/CreateList`;
                try {
                    const fetchFn = async (headers) => await this.fetchWithTimeout(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            variables,
                            features: buildListsFeatures(),
                            queryId,
                        }),
                    });

                    const result = await this.retryWithFallbackHeaders(fetchFn);
                    if (!result.success) {
                        lastError = result.error;
                        continue;
                    }

                    const data = await result.response.json();
                    if (data.errors && data.errors.length > 0) {
                        lastError = data.errors.map((e) => e.message).join(', ');
                        continue;
                    }

                    const listResult = data.data?.list?.list;
                    if (listResult) {
                        return {
                            success: true,
                            list: {
                                id: listResult.id_str,
                                name: listResult.name,
                                description: listResult.description,
                                isPrivate: listResult.mode?.toLowerCase() === 'private',
                                memberCount: listResult.member_count || 0,
                            },
                        };
                    }

                    // Try alternate response path
                    const altResult = data.data?.list;
                    if (altResult?.id_str) {
                        return {
                            success: true,
                            list: {
                                id: altResult.id_str,
                                name: altResult.name,
                                description: altResult.description,
                                isPrivate: altResult.mode?.toLowerCase() === 'private',
                                memberCount: altResult.member_count || 0,
                            },
                        };
                    }

                    return { success: true, list: { id: 'unknown', name } };
                } catch (error) {
                    lastError = error instanceof Error ? error.message : String(error);
                }
            }
            return { success: false, error: lastError ?? 'Unknown error creating list' };
        }

        /**
         * Delete a Twitter list
         */
        async deleteList(listId) {
            await this.ensureClientUserId();

            const variables = { listId };
            const queryIds = ['UnN9Th1BDbeLjpgjGSpL3Q'];

            let lastError;
            for (const queryId of queryIds) {
                const url = `${TWITTER_API_BASE}/${queryId}/DeleteList`;
                try {
                    const fetchFn = async (headers) => await this.fetchWithTimeout(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ variables, queryId }),
                    });

                    const result = await this.retryWithFallbackHeaders(fetchFn);
                    if (!result.success) {
                        lastError = result.error;
                        continue;
                    }

                    const data = await result.response.json();
                    if (data.errors && data.errors.length > 0) {
                        lastError = data.errors.map((e) => e.message).join(', ');
                        continue;
                    }

                    return { success: true };
                } catch (error) {
                    lastError = error instanceof Error ? error.message : String(error);
                }
            }
            return { success: false, error: lastError ?? 'Unknown error deleting list' };
        }

        /**
         * Add a member to a list
         */
        async addListMember(listId, userId) {
            await this.ensureClientUserId();

            const variables = { listId, userId };
            const queryIds = ['EadD8ivrhZhYQr2pDmCpjA'];

            let lastError;
            for (const queryId of queryIds) {
                const url = `${TWITTER_API_BASE}/${queryId}/ListAddMember`;
                try {
                    const fetchFn = async (headers) => await this.fetchWithTimeout(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            variables,
                            features: buildListsFeatures(),
                            queryId,
                        }),
                    });

                    const result = await this.retryWithFallbackHeaders(fetchFn);
                    if (!result.success) {
                        lastError = result.error;
                        continue;
                    }

                    const data = await result.response.json();
                    if (data.errors && data.errors.length > 0) {
                        lastError = data.errors.map((e) => e.message).join(', ');
                        continue;
                    }

                    return { success: true };
                } catch (error) {
                    lastError = error instanceof Error ? error.message : String(error);
                }
            }
            return { success: false, error: lastError ?? 'Unknown error adding list member' };
        }

        /**
         * Remove a member from a list
         */
        async removeListMember(listId, userId) {
            await this.ensureClientUserId();

            const variables = { listId, userId };
            const queryIds = ['B5tMzrMYuFHJex_4EXFTSw'];

            let lastError;
            for (const queryId of queryIds) {
                const url = `${TWITTER_API_BASE}/${queryId}/ListRemoveMember`;
                try {
                    const fetchFn = async (headers) => await this.fetchWithTimeout(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            variables,
                            features: buildListsFeatures(),
                            queryId,
                        }),
                    });

                    const result = await this.retryWithFallbackHeaders(fetchFn);
                    if (!result.success) {
                        lastError = result.error;
                        continue;
                    }

                    const data = await result.response.json();
                    if (data.errors && data.errors.length > 0) {
                        lastError = data.errors.map((e) => e.message).join(', ');
                        continue;
                    }

                    return { success: true };
                } catch (error) {
                    lastError = error instanceof Error ? error.message : String(error);
                }
            }
            return { success: false, error: lastError ?? 'Unknown error removing list member' };
        }

        /**
         * Get members of a list
         */
        async getListMembers(listId, count = 100, cursor) {
            const variables = {
                listId,
                count,
                ...(cursor ? { cursor } : {}),
            };
            const features = buildListsFeatures();
            const params = new URLSearchParams({
                variables: JSON.stringify(variables),
                features: JSON.stringify(features),
            });

            const queryIds = ['7FPk01hdc1jyzL6Gj8vMZw'];

            let lastError;
            for (const queryId of queryIds) {
                const url = `${TWITTER_API_BASE}/${queryId}/ListMembers?${params.toString()}`;
                try {
                    const fetchFn = async (headers) => await this.fetchWithTimeout(url, {
                        method: 'GET',
                        headers,
                    });

                    const result = await this.retryWithFallbackHeaders(fetchFn);
                    if (!result.success) {
                        lastError = result.error;
                        continue;
                    }

                    const data = await result.response.json();
                    if (data.errors && data.errors.length > 0) {
                        lastError = data.errors.map((e) => e.message).join(', ');
                        continue;
                    }

                    const instructions = data.data?.list?.members_timeline?.timeline?.instructions;
                    const members = [];
                    let nextCursor;

                    if (instructions) {
                        for (const instruction of instructions) {
                            if (instruction.entries) {
                                for (const entry of instruction.entries) {
                                    if (entry.entryId?.startsWith('cursor-bottom')) {
                                        nextCursor = entry.content?.value;
                                        continue;
                                    }
                                    const userResult = entry.content?.itemContent?.user_results?.result;
                                    if (userResult?.legacy) {
                                        members.push({
                                            id: userResult.rest_id,
                                            username: userResult.legacy.screen_name,
                                            name: userResult.legacy.name,
                                            description: userResult.legacy.description || '',
                                            followersCount: userResult.legacy.followers_count,
                                            followingCount: userResult.legacy.friends_count,
                                            isVerified: userResult.is_blue_verified || false,
                                        });
                                    }
                                }
                            }
                        }
                    }

                    return { success: true, members, nextCursor };
                } catch (error) {
                    lastError = error instanceof Error ? error.message : String(error);
                }
            }
            return { success: false, error: lastError ?? 'Unknown error fetching list members' };
        }
    }
    return TwitterClientListManage;
}
//# sourceMappingURL=twitter-client-list-manage.js.map
