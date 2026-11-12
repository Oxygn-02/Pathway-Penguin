# AQA A-level Psychology (7182): how Pip marks it, and what it is based on

Status: **A level Psychology finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelPsychology.ts`. Tests: `src/__tests__/aqaALevelPsychology.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AS and A-level Psychology, 7181 and 7182 | Version 1.2, 14 October 2021 |
| Papers 7182/1, /2, /3: question papers | June 2022 and June 2023 | not applicable |
| Papers 7182/1, /2, /3: mark schemes | June 2022 and June 2023 | "Version: 1.0 Final" |

## How the exam is built (from the specification)

| Paper | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| 1 | Social influence, memory, attachment, psychopathology (four sections of 24 marks) | 2 hours | 96 | 33.3% |
| 2 | Approaches, biopsychology, research methods (three sections) | 2 hours | 96 | 33.3% |
| 3 | Issues and debates (compulsory), then one topic from each of three option sections | 2 hours | 96 | 33.3% |

Paper 3 prints more than 96 marks because Sections B to D each offer three topics and a student answers one. Assessment objectives, overall: AO1 30 to 33%, AO2 30 to 33%, AO3 36 to 38%. At least 25 to 30% of the whole assessment is research methods, so research-methods questions appear in all three papers.

## How an A level Psychology answer is marked

1. **Multiple choice and one or two mark questions** are point-based: one mark for each correct choice or point.
2. **Short questions (3 to 6 marks)** are marked from the mark scheme's possible content, with partial credit for a point that is made but not developed. Applied questions need the answer tied to the scenario given.
3. **Extended answers use level of response.** The marker finds the level whose descriptor best fits the whole answer, then picks a mark inside the level. Descriptors judge accuracy and detail of knowledge, how effective the discussion or application is, how clear and organised the answer is, and the use of specialist terms. Ranges read from the mark schemes:
   - 16 marks (discuss questions): levels 13–16, 9–12, 5–8, 1–4. In the discuss questions seen the split is AO1 6 and AO3 10.
   - 12 marks (design an experiment, 7182/2 June 2022 Q19): levels 10–12, 7–9, 4–6, 1–3. AO2 6 and AO3 6.
   - 8 marks: levels 7–8, 5–6, 3–4, 1–2.
   - 6 marks: levels 5–6, 3–4, 1–2.
   - 4 marks: levels 3–4 and 1–2.
4. **Possible content is a guide.** The mark scheme says other creditable points are accepted, so Pip should not insist on the listed studies.
5. **Pip's feedback** names the level reached, says which assessment objective lost marks (knowledge, application or evaluation), and says what would move the answer up a level.

## How the topics and questions were checked

- **Topics.** The specification lists content as bullet statements under 20 numbered sections (4.1.1 to 4.3.10). Each bullet is one topic here, 124 in all, coded section and bullet number (for example 4.1.1#3). AQA does not number the bullets, so the numbers are ours. The skills lists at the start of 4.1, 4.2 and 4.3 are not topics.
- **Marks.** Each cited number's marks are the `[n marks]` printed on the question paper; Papers 1 and 2 add up to 96 and Paper 3 to 96 once one topic per section is chosen (the paper prints 240).
- **Question to topic.** AQA does not publish a topic tag per question, so which question tests which statement is our judgement. 14 of the 159 matches are flagged `check`.
- Statements with no clear question in the six papers are listed as not found rather than matched to a poor fit (31 of 124).

## Coverage by topic

### 4.1.1 Social influence

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.1.1#1 | Types of conformity | not found | | |
| 4.1.1#2 | Conformity to social roles as investigated by Zimbardo | 7182/1 June 2023 Q1 | 2 | ok |
| 4.1.1#3 | Explanations for obedience | 7182/1 June 2022 Q4; 7182/1 June 2023 Q2 | 16, 6 | ok, ok |
| 4.1.1#4 | Explanations of resistance to social influence, including social support and locus of control | 7182/1 June 2022 Q2; 7182/1 June 2022 Q3 | 1, 4 | ok, ok |
| 4.1.1#5 | Minority influence including reference to consistency, commitment and flexibility | 7182/1 June 2022 Q1; 7182/1 June 2023 Q3 | 3, 16 | ok, ok |
| 4.1.1#6 | The role of social influence processes in social change | not found | | |

### 4.1.2 Memory

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.1.2#1 | The multi-store model of memory | 7182/1 June 2022 Q5; 7182/1 June 2022 Q6; 7182/1 June 2023 Q6 | 2, 2, 4 | ok, ok, ok |
| 4.1.2#2 | Types of long-term memory | not found | | |
| 4.1.2#3 | The working memory model | 7182/1 June 2022 Q8 | 16 | ok |
| 4.1.2#4 | Explanations for forgetting | not found | | |
| 4.1.2#5 | Factors affecting the accuracy of eyewitness testimony | 7182/1 June 2023 Q7 | 16 | ok |
| 4.1.2#6 | Improving the accuracy of eyewitness testimony, including the use of the cognitive interview | 7182/1 June 2022 Q7 | 4 | ok |

### 4.1.3 Attachment

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.1.3#1 | Caregiver-infant interactions in humans | not found | | |
| 4.1.3#2 | Animal studies of attachment | 7182/1 June 2022 Q12 | 16 | ok |
| 4.1.3#3 | Explanations of attachment | 7182/1 June 2022 Q9; 7182/1 June 2023 Q8 | 2, 4 | check, ok |
| 4.1.3#4 | Ainsworth’s ‘Strange Situation’ | 7182/1 June 2022 Q10; 7182/1 June 2023 Q9 | 2, 4 | ok, ok |
| 4.1.3#5 | Bowlby’s theory of maternal deprivation | 7182/1 June 2023 Q10 | 16 | ok |
| 4.1.3#6 | The influence of early attachment on childhood and adult relationships, including the role of an int | 7182/1 June 2022 Q11 | 4 | ok |

### 4.1.4 Psychopathology

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.1.4#1 | Definitions of abnormality, including deviation from social norms, failure to function adequately, s | 7182/1 June 2022 Q13; 7182/1 June 2023 Q11; 7182/1 June 2023 Q12 | 6, 4, 5 | ok, ok, ok |
| 4.1.4#2 | The behavioural, emotional and cognitive characteristics of phobias, depression and obsessive-compul | not found | | |
| 4.1.4#3 | The behavioural approach to explaining and treating phobias | 7182/1 June 2022 Q14 | 3 | ok |
| 4.1.4#4 | The cognitive approach to explaining and treating depression | 7182/1 June 2023 Q16 | 8 | ok |
| 4.1.4#5 | The biological approach to explaining and treating OCD | 7182/1 June 2022 Q18 | 8 | ok |

### 4.2.1 Approaches in Psychology

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.2.1#1 | Learning approaches | 7182/2 June 2022 Q2; 7182/2 June 2022 Q3; 7182/2 June 2023 Q3; 7182/2 June 2023 Q4 | 6, 4, 4, 6 | check, ok, ok, ok |
| 4.2.1#2 | The cognitive approach | 7182/2 June 2023 Q2; 7182/2 June 2023 Q6 | 1, 8 | ok, ok |
| 4.2.1#3 | The biological approach | 7182/2 June 2023 Q5 | 4 | ok |
| 4.2.1#4 | The psychodynamic approach | 7182/2 June 2022 Q1; 7182/2 June 2023 Q1 | 6, 1 | ok, ok |
| 4.2.1#5 | Humanistic Psychology | 7182/2 June 2022 Q4 | 8 | ok |
| 4.2.1#6 | Comparison of approaches | not found | | |

### 4.2.2 Biopsychology

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.2.2#1 | The divisions of the nervous system | 7182/2 June 2022 Q7 | 6 | ok |
| 4.2.2#2 | The structure and function of sensory, relay and motor neurons | 7182/2 June 2022 Q5 | 1 | ok |
| 4.2.2#3 | The function of the endocrine system | not found | | |
| 4.2.2#4 | The fight or flight response including the role of adrenaline | 7182/2 June 2023 Q8 | 6 | ok |
| 4.2.2#5 | Localisation of function in the brain and hemispheric lateralisation | 7182/2 June 2022 Q8; 7182/2 June 2023 Q9 | 16, 16 | ok, ok |
| 4.2.2#6 | Ways of studying the brain | 7182/2 June 2022 Q6 | 1 | ok |
| 4.2.2#7 | Biological rhythms | 7182/2 June 2023 Q7 | 2 | ok |

### 4.2.3 Research methods

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.2.3#1 | Experimental method | 7182/2 June 2022 Q19 | 12 | ok |
| 4.2.3#2 | Observational techniques | 7182/2 June 2022 Q9; 7182/2 June 2022 Q10 | 4, 1 | ok, ok |
| 4.2.3#3 | Self-report techniques | not found | | |
| 4.2.3#4 | Correlations | 7182/2 June 2023 Q21 | 4 | ok |
| 4.2.3#5 | Content analysis | 7182/1 June 2023 Q13; 7182/1 June 2023 Q14 | 1, 2 | ok, ok |
| 4.2.3#6 | Case studies | not found | | |

### 4.2.3.1 Scientific processes

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.2.3.1#1 | Aims | not found | | |
| 4.2.3.1#2 | Hypotheses | 7182/2 June 2023 Q10 | 1 | ok |
| 4.2.3.1#3 | Sampling | 7182/2 June 2023 Q20 | 4 | ok |
| 4.2.3.1#4 | Pilot studies and the aims of piloting | not found | | |
| 4.2.3.1#5 | Experimental designs | 7182/2 June 2022 Q19; 7182/2 June 2023 Q11; 7182/3 June 2023 Q28; 7182/3 June 2023 Q33; 7182/3 June 2023 Q38 | 12, 2, 4, 4, 4 | check, ok, ok, ok, ok |
| 4.2.3.1#6 | Observational design | 7182/2 June 2022 Q11; 7182/2 June 2022 Q12; 7182/2 June 2022 Q13 | 4, 4, 4 | ok, ok, ok |
| 4.2.3.1#7 | Questionnaire construction, including use of open and closed questions | not found | | |
| 4.2.3.1#8 | Variables | not found | | |
| 4.2.3.1#9 | Control | 7182/1 June 2023 Q4; 7182/1 June 2023 Q5; 7182/2 June 2023 Q12 | 2, 2, 3 | ok, ok, ok |
| 4.2.3.1#10 | Demand characteristics and investigator effects | 7182/3 June 2023 Q21; 7182/3 June 2023 Q24 | 4, 4 | ok, ok |
| 4.2.3.1#11 | Ethics, including the role of the British Psychological Society’s code of ethics | 7182/2 June 2023 Q24 | 6 | ok |
| 4.2.3.1#12 | The role of peer review in the scientific process | 7182/2 June 2023 Q23 | 2 | ok |
| 4.2.3.1#13 | The implications of psychological research for the economy | 7182/2 June 2022 Q17 | 3 | ok |
| 4.2.3.1#14 | Reliability across all methods of investigation | 7182/1 June 2023 Q15; 7182/2 June 2022 Q14 | 4, 4 | ok, ok |
| 4.2.3.1#15 | Types of validity across all methods of investigation | 7182/2 June 2023 Q13 | 4 | check |
| 4.2.3.1#16 | Features of science | not found | | |
| 4.2.3.1#17 | Reporting psychological investigations | 7182/2 June 2022 Q18 | 3 | ok |

### 4.2.3.2 Data handling and analysis

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.2.3.2#1 | Quantitative and qualitative data | 7182/2 June 2022 Q16; 7182/2 June 2023 Q14 | 2, 4 | ok, ok |
| 4.2.3.2#2 | Primary and secondary data, including meta-analysis | not found | | |
| 4.2.3.2#3 | Descriptive statistics | 7182/2 June 2023 Q15; 7182/2 June 2023 Q16 | 4, 4 | ok, ok |
| 4.2.3.2#4 | Presentation and display of quantitative data | not found | | |
| 4.2.3.2#5 | Distributions | not found | | |
| 4.2.3.2#6 | Analysis and interpretation of correlation, including correlation coefficients | 7182/1 June 2022 Q16 | 1 | ok |
| 4.2.3.2#7 | Levels of measurement | 7182/3 June 2022 Q17; 7182/3 June 2022 Q23; 7182/3 June 2022 Q29 | 4, 4, 4 | ok, ok, ok |
| 4.2.3.2#8 | Content analysis and coding | 7182/1 June 2023 Q14 | 2 | check |

### 4.2.3.3 Inferential testing

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.2.3.3#1 | Introduction to statistical testing | not found | | |
| 4.2.3.3#2 | Probability and significance | 7182/1 June 2022 Q17; 7182/2 June 2023 Q17; 7182/2 June 2023 Q18; 7182/2 June 2023 Q19 | 4, 2, 2, 1 | ok, ok, ok, check |
| 4.2.3.3#3 | Factors affecting the choice of statistical test, including level of measurement and experimental de | 7182/1 June 2022 Q15; 7182/2 June 2022 Q15; 7182/2 June 2023 Q22; 7182/3 June 2022 Q2; 7182/3 June 2023 Q26; 7182/3 June 2023 Q31; 7182/3 June 2023 Q36 | 2, 7, 5, 4, 4, 4, 4 | ok, ok, ok, ok, ok, ok, ok |

### 4.3.1 Issues and debates in Psychology

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.1#1 | Gender and culture in Psychology – universality and bias | 7182/3 June 2023 Q1; 7182/3 June 2023 Q2 | 2, 2 | ok, ok |
| 4.3.1#2 | Free will and determinism | 7182/3 June 2022 Q1; 7182/3 June 2022 Q3; 7182/3 June 2023 Q3 | 2, 4, 4 | ok, check, ok |
| 4.3.1#3 | The nature-nurture debate | 7182/3 June 2023 Q3 | 4 | check |
| 4.3.1#4 | Holism and reductionism | 7182/3 June 2023 Q4 | 16 | ok |
| 4.3.1#5 | Idiographic and nomothetic approaches to psychological investigation | 7182/3 June 2022 Q4; 7182/3 June 2022 Q5 | 4, 2 | ok, ok |
| 4.3.1#6 | Ethical implications of research studies and theory, including reference to social sensitivity | 7182/3 June 2022 Q6 | 8 | ok |

### 4.3.2 Relationships

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.2#1 | The evolutionary explanations for partner preferences, including the relationship between sexual sel | not found | | |
| 4.3.2#2 | Factors affecting attraction in romantic relationships | 7182/3 June 2023 Q5; 7182/3 June 2023 Q6 | 2, 6 | ok, ok |
| 4.3.2#3 | Theories of romantic relationships | 7182/3 June 2022 Q7; 7182/3 June 2023 Q7 | 8, 8 | ok, ok |
| 4.3.2#4 | Virtual relationships in social media | 7182/3 June 2022 Q8 | 16 | ok |
| 4.3.2#5 | Parasocial relationships | 7182/3 June 2023 Q8 | 8 | ok |

### 4.3.3 Gender

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.3#1 | Sex and gender | not found | | |
| 4.3.3#2 | The role of chromosomes and hormones (testosterone, oestrogen and oxytocin) in sex and gender | 7182/3 June 2022 Q10 | 16 | ok |
| 4.3.3#3 | Cognitive explanations of gender development, Kohlberg’s theory, gender identity, gender stability a | 7182/3 June 2022 Q9; 7182/3 June 2023 Q12 | 8, 8 | ok, ok |
| 4.3.3#4 | Psychodynamic explanation of gender development, Freud’s psychoanalytic theory, Oedipus complex | not found | | |
| 4.3.3#5 | Social learning theory as applied to gender development | 7182/3 June 2023 Q11 | 8 | ok |
| 4.3.3#6 | Atypical gender development | 7182/3 June 2023 Q9; 7182/3 June 2023 Q10 | 2, 6 | ok, ok |

### 4.3.4 Cognition and development

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.4#1 | Piaget’s theory of cognitive development | 7182/3 June 2022 Q11; 7182/3 June 2023 Q13; 7182/3 June 2023 Q14 | 8, 2, 6 | check, ok, ok |
| 4.3.4#2 | Vygotsky’s theory of cognitive development, including the zone of proximal development and scaffoldi | 7182/3 June 2022 Q11 | 8 | check |
| 4.3.4#3 | Baillargeon’s explanation of early infant abilities, including knowledge of the physical world | 7182/3 June 2023 Q15 | 8 | ok |
| 4.3.4#4 | The development of social cognition | 7182/3 June 2022 Q12; 7182/3 June 2023 Q16 | 16, 8 | ok, ok |

### 4.3.5 Schizophrenia

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.5#1 | Classification of schizophrenia | 7182/3 June 2023 Q17 | 4 | ok |
| 4.3.5#2 | Biological explanations for schizophrenia | 7182/3 June 2023 Q19 | 16 | check |
| 4.3.5#3 | Psychological explanations for schizophrenia | 7182/3 June 2022 Q15; 7182/3 June 2023 Q19 | 6, 16 | ok, check |
| 4.3.5#4 | Drug therapy | 7182/3 June 2022 Q18; 7182/3 June 2023 Q19 | 8, 16 | ok, check |
| 4.3.5#5 | Cognitive behaviour therapy and family therapy as used in the treatment of schizophrenia | 7182/3 June 2022 Q14 | 1 | ok |
| 4.3.5#6 | The importance of an interactionist approach in explaining and treating schizophrenia | 7182/3 June 2022 Q13 | 1 | ok |

### 4.3.6 Eating behaviour

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.6#1 | Explanations for food preferences | 7182/3 June 2022 Q21; 7182/3 June 2023 Q20 | 6, 4 | ok, ok |
| 4.3.6#2 | Neural and hormonal mechanisms involved in the control of eating behaviour, including the role of th | not found | | |
| 4.3.6#3 | Biological explanations for anorexia nervosa, including genetic and neural explanations | 7182/3 June 2023 Q22 | 16 | check |
| 4.3.6#4 | Psychological explanations for anorexia nervosa | 7182/3 June 2022 Q19; 7182/3 June 2022 Q20; 7182/3 June 2023 Q22 | 1, 1, 16 | ok, ok, ok |
| 4.3.6#5 | Biological explanations for obesity, including genetic and neural explanations | not found | | |
| 4.3.6#6 | Psychological explanations for obesity, including restraint theory, disinhibition and the boundary m | 7182/3 June 2022 Q24 | 8 | ok |

### 4.3.7 Stress

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.7#1 | The physiology of stress, including general adaptation syndrome, the hypothalamic pituitary- adrenal | 7182/3 June 2022 Q26 | 1 | ok |
| 4.3.7#2 | The role of stress in illness, including reference to immunosuppression and cardiovascular disorders | not found | | |
| 4.3.7#3 | Sources of stress | 7182/3 June 2022 Q27; 7182/3 June 2023 Q25 | 6, 16 | ok, ok |
| 4.3.7#4 | Measuring stress | 7182/3 June 2022 Q25 | 1 | ok |
| 4.3.7#5 | Individual differences in stress | 7182/3 June 2023 Q23 | 4 | ok |
| 4.3.7#6 | Managing and coping with stress | 7182/3 June 2022 Q30 | 8 | ok |

### 4.3.8 Aggression

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.8#1 | Neural and hormonal mechanisms in aggression, including the roles of the limbic system, serotonin an | 7182/3 June 2022 Q33 | 16 | ok |
| 4.3.8#2 | The ethological explanation of aggression, including reference to innate releasing mechanisms and fi | not found | | |
| 4.3.8#3 | Social psychological explanations of human aggression, including the frustration-aggression hypothes | 7182/3 June 2023 Q29; 7182/3 June 2023 Q30 | 6, 6 | ok, ok |
| 4.3.8#4 | Institutional aggression in the context of prisons | not found | | |
| 4.3.8#5 | Media influences on aggression, including the effects of computer games | 7182/3 June 2022 Q31; 7182/3 June 2022 Q32; 7182/3 June 2023 Q27 | 4, 4, 4 | ok, ok, ok |

### 4.3.9 Forensic Psychology

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.9#1 | Offender profiling | 7182/3 June 2022 Q34; 7182/3 June 2022 Q35; 7182/3 June 2023 Q32 | 4, 4, 4 | ok, ok, ok |
| 4.3.9#2 | Biological explanations of offending behaviour | not found | | |
| 4.3.9#3 | Psychological explanations of offending behaviour | 7182/3 June 2022 Q36; 7182/3 June 2023 Q34; 7182/3 June 2023 Q35 | 16, 6, 6 | ok, ok, ok |
| 4.3.9#4 | Dealing with offending behaviour | not found | | |

### 4.3.10 Addiction

| Code | Content statement | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.3.10#1 | Describing addiction | not found | | |
| 4.3.10#2 | Risk factors in the development of addiction, including genetic vulnerability, stress, personality,  | 7182/3 June 2022 Q39 | 16 | ok |
| 4.3.10#3 | Explanations for nicotine addiction | 7182/3 June 2023 Q39; 7182/3 June 2023 Q40 | 6, 6 | ok, ok |
| 4.3.10#4 | Explanations for gambling addiction | 7182/3 June 2023 Q37 | 4 | ok |
| 4.3.10#5 | Reducing addiction | not found | | |
| 4.3.10#6 | The application of the following theories of behaviour change to addictive behaviour | 7182/3 June 2022 Q37; 7182/3 June 2022 Q38 | 4, 4 | ok, ok |

## Not found in the six papers read

4.1.1#1, 4.1.1#6, 4.1.2#2, 4.1.2#4, 4.1.3#1, 4.1.4#2, 4.2.1#6, 4.2.2#3, 4.2.3#3, 4.2.3#6, 4.2.3.1#1, 4.2.3.1#4, 4.2.3.1#7, 4.2.3.1#8, 4.2.3.1#16, 4.2.3.2#2, 4.2.3.2#4, 4.2.3.2#5, 4.2.3.3#1, 4.3.2#1, 4.3.3#1, 4.3.3#4, 4.3.6#2, 4.3.6#5, 4.3.7#2, 4.3.8#2, 4.3.8#4, 4.3.9#2, 4.3.9#4, 4.3.10#1, 4.3.10#5.

## What to check

- Whether AQA is the right board for Psychology (assumed).
- The `check` rows, and the topic tags on research-methods questions, which are the least certain.
- Whether you want more series (June 2024 onwards) added to shrink the not-found list.
