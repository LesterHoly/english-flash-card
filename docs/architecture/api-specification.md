# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: English Flash Cards Generator API
  version: 1.0.0
  description: AI-powered educational flash card generation and management API
servers:
  - url: https://your-app.vercel.app/api
    description: Production server
  - url: http://localhost:3000/api
    description: Development server

paths:
  /auth/session:
    get:
      summary: Get current user session
      security:
        - supabaseAuth: []
      responses:
        '200':
          description: Current user session
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /cards/generate:
    post:
      summary: Generate new flash card
      security:
        - supabaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                input_prompt:
                  type: string
                  example: "Animals in the zoo"
                card_type:
                  $ref: '#/components/schemas/CardType'
                generation_params:
                  $ref: '#/components/schemas/GenerationParams'
              required:
                - input_prompt
                - card_type
      responses:
        '200':
          description: Card generation initiated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GenerationSession'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

  /cards/generation/{sessionId}:
    get:
      summary: Check generation status
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Generation status and results
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/GenerationSession'
                  - type: object
                    properties:
                      cards:
                        type: array
                        items:
                          $ref: '#/components/schemas/FlashCard'

  /cards/{cardId}/approve:
    post:
      summary: Approve card after preview
      security:
        - supabaseAuth: []
      parameters:
        - name: cardId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Card approved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FlashCard'

  /cards/{cardId}/download:
    get:
      summary: Download generated card
      security:
        - supabaseAuth: []
      parameters:
        - name: cardId
          in: path
          required: true
          schema:
            type: string
        - name: format
          in: query
          schema:
            type: string
            enum: [pdf, png, jpg]
            default: pdf
      responses:
        '200':
          description: Card file download
          content:
            application/pdf:
              schema:
                type: string
                format: binary
            image/png:
              schema:
                type: string
                format: binary

  /cards:
    get:
      summary: Get user's card library
      security:
        - supabaseAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: card_type
          in: query
          schema:
            $ref: '#/components/schemas/CardType'
      responses:
        '200':
          description: User's card library
          content:
            application/json:
              schema:
                type: object
                properties:
                  cards:
                    type: array
                    items:
                      $ref: '#/components/schemas/FlashCard'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /user/preferences:
    get:
      summary: Get user preferences
      security:
        - supabaseAuth: []
      responses:
        '200':
          description: User preferences
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPreferences'
    
    put:
      summary: Update user preferences
      security:
        - supabaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserPreferences'
      responses:
        '200':
          description: Preferences updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPreferences'

components:
  securitySchemes:
    supabaseAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        preferences:
          $ref: '#/components/schemas/UserPreferences'
        subscription_tier:
          type: string
          enum: [free, educator, premium]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    UserPreferences:
      type: object
      properties:
        skip_preview:
          type: boolean
          default: false
        default_card_type:
          $ref: '#/components/schemas/CardType'
        theme:
          type: string
          enum: [light, dark]
          default: light

    FlashCard:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        title:
          type: string
        card_type:
          $ref: '#/components/schemas/CardType'
        content:
          $ref: '#/components/schemas/CardContent'
        generation_params:
          $ref: '#/components/schemas/GenerationParams'
        status:
          type: string
          enum: [generating, preview, approved, downloaded]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    CardType:
      type: string
      enum: [single_word, category]

    CardContent:
      type: object
      properties:
        primary_word:
          type: string
        scenes:
          type: array
          items:
            $ref: '#/components/schemas/Scene'
        category_words:
          type: array
          items:
            type: string
        layout:
          $ref: '#/components/schemas/CardLayout'

    Scene:
      type: object
      properties:
        id:
          type: string
        description:
          type: string
        image_url:
          type: string
          format: uri
        image_prompt:
          type: string

    CardLayout:
      type: object
      properties:
        format:
          type: string
          enum: ["3:4"]
        orientation:
          type: string
          enum: [portrait, landscape]
        theme:
          type: string
          enum: [bright, colorful, minimal]

    GenerationSession:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        input_prompt:
          type: string
        generation_type:
          type: string
          enum: [single_word_card, category_card, regeneration]
        ai_costs:
          $ref: '#/components/schemas/AICosts'
        status:
          type: string
          enum: [pending, processing, completed, failed]
        error_message:
          type: string
        created_at:
          type: string
          format: date-time
        completed_at:
          type: string
          format: date-time

    GenerationParams:
      type: object
      properties:
        difficulty_level:
          type: string
          enum: [beginner, intermediate, advanced]
        age_group:
          type: string
          enum: [preschool, elementary, middle_school]
        style_preference:
          type: string
          enum: [cartoon, realistic, minimalist]
        language:
          type: string
          default: "en"

    AICosts:
      type: object
      properties:
        text_tokens:
          type: integer
        image_generations:
          type: integer
        total_cost_usd:
          type: number
          format: decimal

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
            timestamp:
              type: string
              format: date-time
            requestId:
              type: string

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    RateLimited:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```
