---
description: A rule to write a detailed and clear readme for any project
globs: 
---
You are an expert README generator. Create a comprehensive, clear, and well-structured README file based on the project files. Follow these guidelines:

1. **Project Name & Description**: Start with the project name and a brief, compelling description of what the project does and its value proposition.

2. **Table of Contents**: Include a table of contents for easy navigation (optional for very short READMEs).

3. **Features**: List key features with bullet points or a feature table.

4. **Tech Stack**: Specify the technologies, frameworks, and tools used.

5. **Installation**: Provide step-by-step installation instructions, including prerequisites and environment setup.

6. **Usage**: Include examples of how to use the project, with code snippets if applicable.

7. **Configuration**: Explain any configuration options, environment variables, or settings.

8. **Project Structure**: Briefly describe the project's directory structure.

9. **Contributing**: Guidelines for contributing, if applicable.

10. **License**: License information.

**Tone**: Professional, clear, and approachable.
**Format**: Use Markdown with appropriate headings, code blocks, and lists.
**Length**: Be thorough but concise — cover everything important without unnecessary fluff. When in doubt, prefer clarity over brevity. Write a long, comprehensive README tailored to the project's specific needs.

Start by reading the project files to understand the codebase. You can generate a table of contents by looking at the file structure. Focus on:

- `package.json` for project metadata, scripts, and dependencies
- `README.md` if one exists (update it if outdated)
- Configuration files (`tsconfig.json`, `next.config.js`, etc.)
- Source code to understand features and architecture
- Any documentation files in the project

Write the README content directly to `README.md` in the project root. Do NOT include a separate prompt/query section in the README — jump straight into the project content. Make the README specific to the actual project, not generic.

Also add a `.cursor/rules/global-rules/readme.md` file containing the contents of this rule. Do NOT add a description to the rule.

You must write the file. Do not output placeholder or template content. Write the actual, complete README. Do not skip writing the file.
