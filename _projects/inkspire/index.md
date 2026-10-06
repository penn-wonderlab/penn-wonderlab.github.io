---
title: "InkSpire"
image: /img/inkspire-logo.svg
description: |
  Use generative AI to help college instructors create scaffolded reading assignments to improve student engagement.
layout: project
status: active
priority: 2
people:
  - yuwei
  - cwang
  - yue
  - bodong

---



## Project Goal

To develop and test **InkSpire**, an AI-enhanced web application that helps college instructors create scaffolded
reading assignments to improve student engagement in science fields.

<img src='/img/inkspire-logo.svg' width='140px' alt='InkSpire logo' />

## Why Disciplinary Reading Scaffolds?

College students are expected to read a lot, and the texts they read are complex and disciplinary. Each field builds and evaluates knowledge in its own way, so making sense of a biology chapter or a psychology study takes more than general strategies like predicting or activating prior knowledge. Students need to read the way people in the discipline read. Research shows that discipline-specific reading scaffolds, such as questions and prompts embedded in the reading, can improve critical reading and course outcomes.

Designing good scaffolds, however, is slow, expert work, and doing it reliably across a whole course is harder still. Existing question-generation tools tend to work from surface features of the text. Newer LLM-based tools are more flexible, but they rarely check whether their questions fit the discipline's reading practices, and they leave out the instructor's context and goals.

## How InkSpire Works

InkSpire is built on the disciplinary literacy framework of [Goldman et al. (2016)](https://doi.org/10.1080/00461520.2016.1168741), which describes how a field reads, reasons, and communicates through five core constructs: epistemology, inquiry practices and strategies of reasoning, overarching concepts and frameworks, forms of representation, and discourse and language structures. The framework shapes every stage of a human-in-the-loop workflow with three components:

1. **Class Profile co-construction.** Instructors describe their discipline, course, and students. InkSpire turns this into a structured profile of the instructional context: how knowledge is read and validated in the field, the course's learning goals and key terms, students' prior knowledge and likely challenges, and the instructor's priorities about what to emphasize or avoid. The system shows its design rationale so instructors can check and refine the profile before anything is generated.
2. **Theory-informed scaffold generation.** A multi-step pipeline turns a reading into scaffolds in four stages:
   - The **Material Analyst** reads the text section by section, noting cognitive load and flagging passages that carry the discipline's core constructs.
   - The **Focus Area Identifier** applies explicit rules, informed by cognitive load theory and the disciplinary literacy framework, to choose the passages most worth scaffolding and checks them against course goals.
   - The **Scaffold Generator** matches each passage to a type of scaffold. For example, a dense passage gets a clarifying prompt, while a passage about inquiry practices gets a prompt to interpret evidence or build an explanation the way an expert in the field would.
   - The **Quality Controller** reviews the full set for coherence and coverage.
3. **Instructor review and deployment.** Instructors accept, decline, edit, or refine each scaffold with the AI. Each scaffold sits next to its highlighted source passage, so it's easy to check. Accepted scaffolds can be copied, downloaded, or sent straight to [Perusall](https://www.perusall.com/), where they appear as instructor annotations anchored to the text and become starting points for students' collaborative discussion.


## Pilots and Next Steps

Pilot studies are under way in undergraduate and graduate classrooms about neuroscience and materials science. Working closely with instructor participants, we are investigating how this AI-enhanced approach
affects instructors' design practices and students' reading engagement, skills, and dispositions.

## Publications

- Liang, Y., Wang, R., & Chen, B. (2026). [*InkSpire: An LLM-Powered System for Designing and Generating Disciplinarily Aligned and Context-Aware Reading Scaffolds*](https://ceur-ws.org/Vol-4231/itb26_s3s2.pdf). In the *Proceedings of the Seventh International Workshop on Intelligent Textbooks 2026*, Seoul, Republic of Korea, pp. 51-59.

## Acknowledgement

This project is funded by the Alfred P. Sloan Foundation (#G-2025-25241).

<img src='https://sloan.org/storage/app/media/uploaded-files/Logo-1B-SMALL-Gold-Blue.png' width='200px' />
