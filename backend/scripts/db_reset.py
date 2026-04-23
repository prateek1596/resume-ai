from __future__ import annotations

import argparse

from app.services.db import init_db, reset_db


def main() -> None:
    parser = argparse.ArgumentParser(description='Reset ResumeAI SQLite database')
    parser.add_argument('--remove-file', action='store_true', help='Delete the database file instead of dropping tables')
    parser.add_argument('--recreate', action='store_true', help='Recreate schema after reset')
    args = parser.parse_args()

    reset_db(remove_file=args.remove_file)
    if args.recreate:
        init_db()


if __name__ == '__main__':
    main()
