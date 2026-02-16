// ABOUTME: CLI commands for Twitter List management (create, delete, add/remove members).
// ADDED BY: Aegis Research Group (dannywmarks/bird-cli)
import { TwitterClient } from '../lib/twitter-client.js';
import { extractListId } from '../lib/extract-list-id.js';
import { hyperlink } from '../lib/output.js';

async function resolveUserId(client, usernameOrId) {
    // If it looks like a numeric ID, use it directly
    if (/^\d+$/.test(usernameOrId)) {
        return { success: true, userId: usernameOrId, username: null };
    }
    // Strip @ prefix
    const handle = usernameOrId.replace(/^@/, '');
    // Look up user by username
    const result = await client.getUserIdByUsername(handle);
    if (result.success && result.userId) {
        return { success: true, userId: result.userId, username: result.username || handle };
    }
    return { success: false, error: `Could not resolve user: ${handle}` };
}

export function registerListManageCommands(program, ctx) {
    // bird list-create <name>
    program
        .command('list-create <name>')
        .description('Create a new Twitter list')
        .option('-d, --description <text>', 'List description', '')
        .option('--public', 'Make the list public (default: private)')
        .option('--json', 'Output as JSON')
        .action(async (name, cmdOpts) => {
            const opts = program.opts();
            const timeoutMs = ctx.resolveTimeoutFromOptions(opts);
            const { cookies, warnings } = await ctx.resolveCredentialsFromOptions(opts);
            for (const warning of warnings) {
                console.error(`${ctx.p('warn')}${warning}`);
            }
            if (!cookies.authToken || !cookies.ct0) {
                console.error(`${ctx.p('err')}Missing required credentials`);
                process.exit(1);
            }

            const client = new TwitterClient({ cookies, timeoutMs });
            const isPrivate = !cmdOpts.public;
            const result = await client.createList(name, cmdOpts.description, isPrivate);

            if (result.success && result.list) {
                if (cmdOpts.json) {
                    console.log(JSON.stringify(result.list, null, 2));
                } else {
                    const visibility = result.list.isPrivate ? 'private' : 'public';
                    const listUrl = `https://x.com/i/lists/${result.list.id}`;
                    console.log(`${ctx.p('ok')}Created ${visibility} list: ${result.list.name}`);
                    console.log(`  ${ctx.colors.accent(hyperlink(listUrl, listUrl, ctx.getOutput()))}`);
                    console.log(`  ID: ${result.list.id}`);
                }
            } else {
                console.error(`${ctx.p('err')}Failed to create list: ${result.error}`);
                process.exit(1);
            }
        });

    // bird list-delete <list-id-or-url>
    program
        .command('list-delete <list-id-or-url>')
        .description('Delete a Twitter list')
        .action(async (listIdOrUrl, cmdOpts) => {
            const opts = program.opts();
            const timeoutMs = ctx.resolveTimeoutFromOptions(opts);
            const listId = extractListId(listIdOrUrl);
            if (!listId) {
                console.error(`${ctx.p('err')}Invalid list ID or URL.`);
                process.exit(2);
            }
            const { cookies, warnings } = await ctx.resolveCredentialsFromOptions(opts);
            for (const warning of warnings) {
                console.error(`${ctx.p('warn')}${warning}`);
            }
            if (!cookies.authToken || !cookies.ct0) {
                console.error(`${ctx.p('err')}Missing required credentials`);
                process.exit(1);
            }

            const client = new TwitterClient({ cookies, timeoutMs });
            const result = await client.deleteList(listId);

            if (result.success) {
                console.log(`${ctx.p('ok')}Deleted list ${listId}`);
            } else {
                console.error(`${ctx.p('err')}Failed to delete list: ${result.error}`);
                process.exit(1);
            }
        });

    // bird list-add <list-id-or-url> <username...>
    program
        .command('list-add <list-id-or-url> <usernames...>')
        .description('Add members to a Twitter list')
        .option('--json', 'Output as JSON')
        .action(async (listIdOrUrl, usernames, cmdOpts) => {
            const opts = program.opts();
            const timeoutMs = ctx.resolveTimeoutFromOptions(opts);
            const listId = extractListId(listIdOrUrl);
            if (!listId) {
                console.error(`${ctx.p('err')}Invalid list ID or URL.`);
                process.exit(2);
            }
            const { cookies, warnings } = await ctx.resolveCredentialsFromOptions(opts);
            for (const warning of warnings) {
                console.error(`${ctx.p('warn')}${warning}`);
            }
            if (!cookies.authToken || !cookies.ct0) {
                console.error(`${ctx.p('err')}Missing required credentials`);
                process.exit(1);
            }

            const client = new TwitterClient({ cookies, timeoutMs });
            const results = [];

            for (const username of usernames) {
                const resolved = await resolveUserId(client, username);
                if (!resolved.success) {
                    console.error(`${ctx.p('warn')}Skipping ${username}: ${resolved.error}`);
                    results.push({ username, success: false, error: resolved.error });
                    continue;
                }

                const addResult = await client.addListMember(listId, resolved.userId);
                const displayName = resolved.username || username;
                if (addResult.success) {
                    console.log(`${ctx.p('ok')}Added @${displayName} to list`);
                    results.push({ username: displayName, userId: resolved.userId, success: true });
                } else {
                    console.error(`${ctx.p('warn')}Failed to add @${displayName}: ${addResult.error}`);
                    results.push({ username: displayName, success: false, error: addResult.error });
                }

                // Small delay between adds to avoid rate limiting
                if (usernames.indexOf(username) < usernames.length - 1) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (cmdOpts.json) {
                console.log(JSON.stringify(results, null, 2));
            }
        });

    // bird list-remove <list-id-or-url> <username...>
    program
        .command('list-remove <list-id-or-url> <usernames...>')
        .description('Remove members from a Twitter list')
        .option('--json', 'Output as JSON')
        .action(async (listIdOrUrl, usernames, cmdOpts) => {
            const opts = program.opts();
            const timeoutMs = ctx.resolveTimeoutFromOptions(opts);
            const listId = extractListId(listIdOrUrl);
            if (!listId) {
                console.error(`${ctx.p('err')}Invalid list ID or URL.`);
                process.exit(2);
            }
            const { cookies, warnings } = await ctx.resolveCredentialsFromOptions(opts);
            for (const warning of warnings) {
                console.error(`${ctx.p('warn')}${warning}`);
            }
            if (!cookies.authToken || !cookies.ct0) {
                console.error(`${ctx.p('err')}Missing required credentials`);
                process.exit(1);
            }

            const client = new TwitterClient({ cookies, timeoutMs });
            const results = [];

            for (const username of usernames) {
                const resolved = await resolveUserId(client, username);
                if (!resolved.success) {
                    console.error(`${ctx.p('warn')}Skipping ${username}: ${resolved.error}`);
                    results.push({ username, success: false, error: resolved.error });
                    continue;
                }

                const removeResult = await client.removeListMember(listId, resolved.userId);
                const displayName = resolved.username || username;
                if (removeResult.success) {
                    console.log(`${ctx.p('ok')}Removed @${displayName} from list`);
                    results.push({ username: displayName, userId: resolved.userId, success: true });
                } else {
                    console.error(`${ctx.p('warn')}Failed to remove @${displayName}: ${removeResult.error}`);
                    results.push({ username: displayName, success: false, error: removeResult.error });
                }

                if (usernames.indexOf(username) < usernames.length - 1) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (cmdOpts.json) {
                console.log(JSON.stringify(results, null, 2));
            }
        });

    // bird list-members <list-id-or-url>
    program
        .command('list-members <list-id-or-url>')
        .description('Show members of a Twitter list')
        .option('-n, --count <number>', 'Number of members to fetch', '100')
        .option('--json', 'Output as JSON')
        .action(async (listIdOrUrl, cmdOpts) => {
            const opts = program.opts();
            const timeoutMs = ctx.resolveTimeoutFromOptions(opts);
            const listId = extractListId(listIdOrUrl);
            if (!listId) {
                console.error(`${ctx.p('err')}Invalid list ID or URL.`);
                process.exit(2);
            }
            const { cookies, warnings } = await ctx.resolveCredentialsFromOptions(opts);
            for (const warning of warnings) {
                console.error(`${ctx.p('warn')}${warning}`);
            }
            if (!cookies.authToken || !cookies.ct0) {
                console.error(`${ctx.p('err')}Missing required credentials`);
                process.exit(1);
            }

            const client = new TwitterClient({ cookies, timeoutMs });
            const count = Number.parseInt(cmdOpts.count || '100', 10);
            const result = await client.getListMembers(listId, count);

            if (result.success && result.members) {
                if (cmdOpts.json) {
                    console.log(JSON.stringify(result.members, null, 2));
                } else {
                    if (result.members.length === 0) {
                        console.log('No members in this list.');
                    } else {
                        console.log(`${result.members.length} members:\n`);
                        for (const member of result.members) {
                            const verified = member.isVerified ? ' ✓' : '';
                            console.log(`@${member.username}${verified} (${member.name})`);
                            console.log(`  ${member.followersCount?.toLocaleString() ?? '?'} followers`);
                            if (member.description) {
                                console.log(`  ${member.description.slice(0, 100)}${member.description.length > 100 ? '...' : ''}`);
                            }
                            console.log('──────────────────────────────────────────────────');
                        }
                    }
                }
            } else {
                console.error(`${ctx.p('err')}Failed to fetch list members: ${result.error}`);
                process.exit(1);
            }
        });
}
//# sourceMappingURL=list-manage.js.map
