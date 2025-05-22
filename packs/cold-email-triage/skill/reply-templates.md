# Reply templates

The drafts you produce should sound like the operator wrote them between meetings on a phone. Lowercase openings are fine. No "Hope you're well." No "Just circling back." No exclamation marks unless the inbound used one first and even then sparingly.

## HOT — specific reference + concrete ask

```
thanks {first_name}, that's a fair read on {specific_thing_they_referenced}.

happy to do {their_ask}. {available_slot_or_link}.

what would make this most useful for you?
```

## HOT — investor / partnership intro

```
appreciated, {first_name} — {fund_or_company} has been on my radar.

short version on where we are: {one_sentence_status}.

if a 20 min call still makes sense, here: {calendar_link}.
```

## WARM — interesting but not now

```
thanks {first_name}. interesting angle, not the right moment for us to dig in.

if you're still around in a quarter, ping me again with {specific_thing_to_send}.
```

## WARM — defer with light open door

```
thanks for the note. not a fit right now — {one_sentence_why}.

if {trigger_condition} changes, worth picking back up.
```

## NEEDS-HUMAN — flag, do not draft

Return `draft_reply: null`. The operator will handle it.

---

## Voice rules

- First-person singular when the operator is a founder; first-person plural ("we") when they're representing a team. Inferred from inbound tone or set in config.
- No em dashes (the operator hates them). Use commas or full stops.
- Never invent a calendar link, price, or commitment. Use placeholders the operator can fill, in `{curly_braces}`, and list them at the bottom of the draft if there are more than two.
- If you can't draft confidently, return `null` and label `needs-human`.
